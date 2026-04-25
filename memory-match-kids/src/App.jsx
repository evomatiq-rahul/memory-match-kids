import React, { useState, useEffect, useRef } from 'react';
import { Star, RotateCcw, Home, Sparkles, Book, Users, Calendar, Volume2, VolumeX, Lock, Check, Wifi, Copy, Clock, WifiOff } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, update, remove, onValue, off } from 'firebase/database';

// ============ FIREBASE CONFIG ============
const firebaseConfig = {
  apiKey: "AIzaSyBTJGj9KBMsPUi3M9aKuiIvdl7PnBnoyTE",
  authDomain: "memory-match-kids.firebaseapp.com",
  databaseURL: "https://memory-match-kids-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "memory-match-kids",
  storageBucket: "memory-match-kids.firebasestorage.app",
  messagingSenderId: "547915318708",
  appId: "1:547915318708:web:acdf31843f0bef44d71ee1"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

const STORAGE_KEY = 'memoryMatchGame_v1';

const MemoryMatchGame = () => {
  const [screen, setScreen] = useState('home');
  const [level, setLevel] = useState('easy');
  const [theme, setTheme] = useState('animals');
  const [mode, setMode] = useState('solo');
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [showFact, setShowFact] = useState(null);
  const [stars, setStars] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [collection, setCollection] = useState({});
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [dailyDoneDate, setDailyDoneDate] = useState(null);
  
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [playerNumber, setPlayerNumber] = useState(null);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  const audioCtx = useRef(null);
  const audioUnlocked = useRef(false);
  const timerIntervalRef = useRef(null);
  const turnStartTimeRef = useRef(0);
  const roomRefRef = useRef(null);
  const localUpdateRef = useRef(0);

  const themes = {
    animals: {
      label: 'Animals', emoji: '🦊', bg: 'from-green-300 via-emerald-300 to-teal-300',
      items: [
        { emoji: '🦁', name: 'Lion', fact: 'Lions can roar so loud, you can hear them from 5 miles away!' },
        { emoji: '🐘', name: 'Elephant', fact: 'Elephants can remember their friends for over 30 years!' },
        { emoji: '🦒', name: 'Giraffe', fact: 'Giraffes have purple tongues that are 20 inches long!' },
        { emoji: '🐧', name: 'Penguin', fact: 'Penguins give pebbles as gifts to their best friends!' },
        { emoji: '🐢', name: 'Turtle', fact: 'Some turtles can live to be over 100 years old!' },
        { emoji: '🦋', name: 'Butterfly', fact: 'Butterflies taste their food with their feet!' },
        { emoji: '🐬', name: 'Dolphin', fact: 'Dolphins call each other by name with special whistles!' },
        { emoji: '🦊', name: 'Fox', fact: 'Foxes use the magnetic field of Earth to hunt!' },
        { emoji: '🐼', name: 'Panda', fact: 'Pandas eat for 12 hours every single day!' },
        { emoji: '🦉', name: 'Owl', fact: 'Owls can turn their heads almost all the way around!' },
      ],
    },
    dinosaurs: {
      label: 'Dinosaurs', emoji: '🦖', bg: 'from-orange-300 via-red-300 to-pink-300',
      items: [
        { emoji: '🦖', name: 'T-Rex', fact: 'T-Rex had teeth as big as bananas!' },
        { emoji: '🦕', name: 'Brachiosaurus', fact: 'Brachiosaurus was as tall as a 4-story building!' },
        { emoji: '🐉', name: 'Dragon-saur', fact: 'Some dinosaurs had feathers like birds today!' },
        { emoji: '🥚', name: 'Dino Egg', fact: 'The biggest dinosaur eggs were as big as soccer balls!' },
        { emoji: '🦴', name: 'Fossil', fact: 'Fossils help us learn what dinosaurs looked like!' },
        { emoji: '🌋', name: 'Volcano', fact: 'Volcanoes erupted often during dinosaur times!' },
        { emoji: '🌿', name: 'Fern', fact: 'Many dinosaurs ate ferns for their meals!' },
        { emoji: '☄️', name: 'Comet', fact: 'A giant comet may have ended the dinosaur age!' },
        { emoji: '🦎', name: 'Reptile', fact: 'Dinosaur means "terrible lizard" in Greek!' },
        { emoji: '🐊', name: 'Croco-saur', fact: 'Crocodiles lived with dinosaurs and still exist today!' },
      ],
    },
    space: {
      label: 'Space', emoji: '🚀', bg: 'from-indigo-400 via-purple-500 to-pink-500',
      items: [
        { emoji: '🚀', name: 'Rocket', fact: 'Rockets travel faster than 25,000 miles per hour!' },
        { emoji: '🌍', name: 'Earth', fact: 'Earth is the only planet known to have life!' },
        { emoji: '🌙', name: 'Moon', fact: 'The Moon is moving away from Earth slowly each year!' },
        { emoji: '⭐', name: 'Star', fact: 'Stars are giant balls of glowing hot gas!' },
        { emoji: '🪐', name: 'Saturn', fact: 'Saturn has rings made of ice and rock!' },
        { emoji: '☄️', name: 'Comet', fact: 'Comets have long tails made of dust and gas!' },
        { emoji: '👽', name: 'Alien', fact: 'Scientists are still searching for life in space!' },
        { emoji: '🛸', name: 'UFO', fact: 'UFO means "Unidentified Flying Object"!' },
        { emoji: '🌌', name: 'Galaxy', fact: 'Our galaxy has over 100 billion stars!' },
        { emoji: '🌞', name: 'Sun', fact: 'The Sun is so big, 1 million Earths could fit inside!' },
      ],
    },
    vehicles: {
      label: 'Vehicles', emoji: '🚗', bg: 'from-yellow-300 via-orange-300 to-red-300',
      items: [
        { emoji: '🚗', name: 'Car', fact: 'The first car was invented over 130 years ago!' },
        { emoji: '🚂', name: 'Train', fact: 'The fastest trains can go over 350 miles per hour!' },
        { emoji: '✈️', name: 'Airplane', fact: 'Airplanes fly higher than the tallest mountain!' },
        { emoji: '🚢', name: 'Ship', fact: 'The biggest ships can carry over 20,000 cars!' },
        { emoji: '🚲', name: 'Bicycle', fact: 'Bicycles are the most popular vehicle in the world!' },
        { emoji: '🚒', name: 'Fire Truck', fact: 'Fire trucks carry up to 1,000 gallons of water!' },
        { emoji: '🚀', name: 'Rocket', fact: 'Rockets need huge amounts of fuel to reach space!' },
        { emoji: '🚁', name: 'Helicopter', fact: 'Helicopters can fly straight up and hover in place!' },
        { emoji: '🏎️', name: 'Race Car', fact: 'Race cars can go faster than 200 miles per hour!' },
        { emoji: '🚌', name: 'Bus', fact: 'The longest bus in the world has 5 sections!' },
      ],
    },
    underwater: {
      label: 'Underwater', emoji: '🐠', bg: 'from-cyan-300 via-blue-400 to-indigo-400',
      items: [
        { emoji: '🐙', name: 'Octopus', fact: 'Octopuses have three hearts and blue blood!' },
        { emoji: '🐠', name: 'Fish', fact: 'There are over 30,000 different kinds of fish!' },
        { emoji: '🦈', name: 'Shark', fact: 'Sharks have been around longer than dinosaurs!' },
        { emoji: '🐢', name: 'Sea Turtle', fact: 'Sea turtles can hold their breath for hours!' },
        { emoji: '🦑', name: 'Squid', fact: 'Giant squids have eyes as big as dinner plates!' },
        { emoji: '🐡', name: 'Pufferfish', fact: 'Pufferfish puff up to scare away predators!' },
        { emoji: '🦀', name: 'Crab', fact: 'Crabs walk sideways on the ocean floor!' },
        { emoji: '🐚', name: 'Seashell', fact: 'You can hear the ocean in some seashells!' },
        { emoji: '🐳', name: 'Whale', fact: 'Blue whales are the biggest animals ever to live!' },
        { emoji: '🐟', name: 'Tropical Fish', fact: 'Some fish change colors to hide from danger!' },
      ],
    },
  };

  const levels = {
    starter: { pairs: 2, grid: 'grid-cols-2', label: 'Starter', stars: 1, timer: 45 },
    easy: { pairs: 6, grid: 'grid-cols-4', label: 'Easy', stars: 2, timer: 30 },
    medium: { pairs: 8, grid: 'grid-cols-4', label: 'Medium', stars: 3, timer: 25 },
    challenge: { pairs: 10, grid: 'grid-cols-5', label: 'Challenge', stars: 4, timer: 20 },
  };

  // ============ LOCALSTORAGE ============
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.collection) setCollection(data.collection);
        if (data.dailyDoneDate) setDailyDoneDate(data.dailyDoneDate);
        if (typeof data.soundOn === 'boolean') setSoundOn(data.soundOn);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        collection, dailyDoneDate, soundOn,
      }));
    } catch (e) {}
  }, [collection, dailyDoneDate, soundOn]);

  const todayDateString = () => {
    const t = new Date();
    return `${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`;
  };
  const dailyDone = dailyDoneDate === todayDateString();

  // ============ AUDIO ============
  const unlockAudio = () => {
    if (audioUnlocked.current) return;
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
      const buffer = audioCtx.current.createBuffer(1, 1, 22050);
      const source = audioCtx.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.current.destination);
      source.start(0);
      audioUnlocked.current = true;
    } catch (e) {}
  };

  const playSound = (type) => {
    if (!soundOn) return;
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtx.current;
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'flip') {
        osc.frequency.value = 600;
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(); osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'match') {
        [523, 659, 784].forEach((freq, i) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4 + i * 0.1);
          o.start(ctx.currentTime + i * 0.1); o.stop(ctx.currentTime + 0.5 + i * 0.1);
        });
      } else if (type === 'noMatch') {
        osc.frequency.value = 200;
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(); osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'win') {
        [523, 659, 784, 1047].forEach((freq, i) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
          g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5 + i * 0.15);
          o.start(ctx.currentTime + i * 0.15); o.stop(ctx.currentTime + 0.6 + i * 0.15);
        });
      } else if (type === 'click') {
        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.start(); osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'tick') {
        osc.frequency.value = 1000;
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.start(); osc.stop(ctx.currentTime + 0.05);
      }
    } catch (e) {}
  };

  const tap = (sound) => { unlockAudio(); if (sound) playSound(sound); };

  const getDailyChallenge = () => {
    const today = new Date();
    const seed = today.getDate() + today.getMonth() * 31;
    const themeKeys = Object.keys(themes);
    return { theme: themeKeys[seed % themeKeys.length] };
  };

  // ============ FIREBASE MULTIPLAYER ============
  const generateRoomCode = () => Math.floor(1000 + Math.random() * 9000).toString();

  const createRoom = async (selectedLevel, selectedTheme) => {
    setConnectionError('');
    setConnectionStatus('connecting');
    
    const numPairs = levels[selectedLevel].pairs;
    const themeItems = themes[selectedTheme].items;
    const selectedItems = [...themeItems].sort(() => Math.random() - 0.5).slice(0, numPairs);
    const cardPairs = [...selectedItems, ...selectedItems]
      .map((item, index) => ({ ...item, id: index }))
      .sort(() => Math.random() - 0.5);

    let code, attempts = 0;
    while (attempts < 5) {
      code = generateRoomCode();
      try {
        const snapshot = await get(ref(db, `rooms/${code}`));
        if (!snapshot.exists()) break;
      } catch (e) {
        setConnectionError('Could not connect. Check your internet.');
        setConnectionStatus('disconnected');
        return;
      }
      attempts++;
    }

    const initialState = {
      code, level: selectedLevel, theme: selectedTheme, cards: cardPairs,
      flipped: [], matched: [], currentPlayer: 1, scores: { p1: 0, p2: 0 },
      player1Joined: true, player2Joined: false,
      turnStartTime: Date.now(), timerDuration: levels[selectedLevel].timer,
      gameOver: false, lastFact: null, created: Date.now(),
      lastUpdate: Date.now(), updateBy: 1,
    };

    try {
      await set(ref(db, `rooms/${code}`), initialState);
      setRoomCode(code);
      setPlayerNumber(1);
      setLevel(selectedLevel);
      setTheme(selectedTheme);
      setCards(cardPairs);
      setMode('online');
      setFlipped([]); setMatched([]);
      setCurrentPlayer(1); setScores({ p1: 0, p2: 0 });
      setOpponentJoined(false);
      setConnectionStatus('connected');
      setScreen('onlineWaiting');
      attachRoomListener(code, 1);
    } catch (e) {
      console.error('Create room error:', e);
      setConnectionError('Could not create room. Try again.');
      setConnectionStatus('disconnected');
    }
  };

  const joinRoom = async (code) => {
    if (!code || code.length !== 4) {
      setConnectionError('Please enter a 4-digit code');
      return;
    }
    setConnectionError('');
    setConnectionStatus('connecting');

    try {
      const snapshot = await get(ref(db, `rooms/${code}`));
      if (!snapshot.exists()) {
        setConnectionError('Room not found. Check the code.');
        setConnectionStatus('disconnected');
        return;
      }
      const data = snapshot.val();
      if (data.player2Joined) {
        setConnectionError('Room is full.');
        setConnectionStatus('disconnected');
        return;
      }
      if (Date.now() - data.created > 30 * 60 * 1000) {
        setConnectionError('This room has expired.');
        setConnectionStatus('disconnected');
        return;
      }

      await update(ref(db, `rooms/${code}`), {
        player2Joined: true,
        turnStartTime: Date.now(),
        lastUpdate: Date.now(),
        updateBy: 2,
      });
      
      setRoomCode(code);
      setPlayerNumber(2);
      setLevel(data.level);
      setTheme(data.theme);
      setCards(data.cards);
      setFlipped(data.flipped || []);
      setMatched(data.matched || []);
      setCurrentPlayer(data.currentPlayer || 1);
      setScores(data.scores || { p1: 0, p2: 0 });
      setMode('online');
      setOpponentJoined(true);
      turnStartTimeRef.current = Date.now();
      setTimeLeft(levels[data.level].timer);
      setConnectionStatus('connected');
      setScreen('game');
      attachRoomListener(code, 2);
    } catch (e) {
      console.error('Join room error:', e);
      setConnectionError('Could not join room. Try again.');
      setConnectionStatus('disconnected');
    }
  };

  const attachRoomListener = (code, pNum) => {
    const roomRef = ref(db, `rooms/${code}`);
    roomRefRef.current = roomRef;
    
    onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setConnectionError('Room closed.');
        return;
      }
      
      if (data.lastUpdate === localUpdateRef.current) return;
      
      if (pNum === 1 && data.player2Joined && !opponentJoined) {
        setOpponentJoined(true);
        setFlipped(data.flipped || []);
        setMatched(data.matched || []);
        setCurrentPlayer(data.currentPlayer);
        setScores(data.scores);
        turnStartTimeRef.current = data.turnStartTime;
        setTimeLeft(Math.max(0, levels[data.level].timer - Math.floor((Date.now() - data.turnStartTime) / 1000)));
        setScreen('game');
        return;
      }
      
      const remoteFlipped = data.flipped || [];
      const remoteMatched = data.matched || [];
      
      if (remoteFlipped.length > flipped.length && data.updateBy !== pNum) playSound('flip');
      
      if (remoteMatched.length > matched.length && data.updateBy !== pNum) {
        playSound('match');
        const newlyMatched = remoteMatched.filter(i => !matched.includes(i));
        if (newlyMatched.length > 0) {
          const matchedCard = data.cards[newlyMatched[0]];
          setCollection((prev) => ({
            ...prev,
            [data.theme]: { ...(prev[data.theme] || {}), [matchedCard.name]: matchedCard },
          }));
        }
      }
      
      if (remoteFlipped.length === 0 && flipped.length === 2 && data.updateBy !== pNum) {
        playSound('noMatch');
      }
      
      setFlipped(remoteFlipped);
      setMatched(remoteMatched);
      setCurrentPlayer(data.currentPlayer);
      setScores(data.scores);
      
      turnStartTimeRef.current = data.turnStartTime;
      const elapsed = Math.floor((Date.now() - data.turnStartTime) / 1000);
      setTimeLeft(Math.max(0, data.timerDuration - elapsed));
      
      if (data.gameOver) {
        setTimeout(() => {
          playSound('win');
          setScreen('win');
          if (roomRefRef.current) { off(roomRefRef.current); roomRefRef.current = null; }
        }, 1500);
      }
    });
  };

  const updateRoom = async (updates) => {
    if (!roomCode) return;
    const updateTime = Date.now();
    localUpdateRef.current = updateTime;
    try {
      await update(ref(db, `rooms/${roomCode}`), {
        ...updates,
        lastUpdate: updateTime,
        updateBy: playerNumber,
      });
    } catch (e) {
      console.error('Update room error:', e);
    }
  };

  const leaveRoom = async () => {
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    if (roomRefRef.current) { try { off(roomRefRef.current); } catch (e) {} roomRefRef.current = null; }
    if (roomCode && playerNumber === 1) {
      try { await remove(ref(db, `rooms/${roomCode}`)); } catch (e) {}
    }
    setRoomCode(''); setJoinCode(''); setPlayerNumber(null);
    setOpponentJoined(false); setConnectionStatus('disconnected'); setConnectionError('');
    setScreen('home');
  };

  const copyRoomCode = () => {
    try { navigator.clipboard.writeText(roomCode); playSound('match'); } catch (e) {}
  };

  useEffect(() => {
    if (mode !== 'online' || screen !== 'game') return;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - turnStartTimeRef.current) / 1000);
      const remaining = Math.max(0, levels[level].timer - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 5 && remaining > 0 && currentPlayer === playerNumber) playSound('tick');
      if (remaining === 0 && currentPlayer === playerNumber) handleTimeUp();
    }, 1000);
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [mode, screen, currentPlayer, playerNumber, level]);

  const handleTimeUp = async () => {
    if (currentPlayer !== playerNumber) return;
    const newPlayer = currentPlayer === 1 ? 2 : 1;
    setFlipped([]);
    setCurrentPlayer(newPlayer);
    turnStartTimeRef.current = Date.now();
    setTimeLeft(levels[level].timer);
    await updateRoom({ flipped: [], currentPlayer: newPlayer, turnStartTime: Date.now() });
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (roomRefRef.current) { try { off(roomRefRef.current); } catch (e) {} }
    };
  }, []);

  // ============ OFFLINE GAME ============
  const startGame = (selectedLevel, selectedTheme = theme, gameMode = 'solo') => {
    const numPairs = levels[selectedLevel].pairs;
    const themeItems = themes[selectedTheme].items;
    const selectedItems = [...themeItems].sort(() => Math.random() - 0.5).slice(0, numPairs);
    const cardPairs = [...selectedItems, ...selectedItems]
      .map((item, index) => ({ ...item, id: index }))
      .sort(() => Math.random() - 0.5);
    setLevel(selectedLevel); setTheme(selectedTheme); setMode(gameMode);
    setCards(cardPairs); setFlipped([]); setMatched([]); setMoves(0);
    setShowFact(null); setStars(0); setCurrentPlayer(1); setScores({ p1: 0, p2: 0 });
    setScreen('game');
  };

  const handleCardClick = async (index) => {
    unlockAudio();
    if (isChecking || flipped.includes(index) || matched.includes(index)) return;
    if (flipped.length === 2) return;
    
    if (mode === 'online') {
      if (currentPlayer !== playerNumber) return;
      if (timeLeft <= 0) return;
      if (!opponentJoined) return;
      
      playSound('flip');
      const newFlipped = [...flipped, index];
      setFlipped(newFlipped);
      await updateRoom({ flipped: newFlipped });
      
      if (newFlipped.length === 2) {
        setIsChecking(true);
        const [first, second] = newFlipped;
        if (cards[first].name === cards[second].name) {
          setTimeout(async () => {
            playSound('match');
            const newMatched = [...matched, first, second];
            const newScores = { ...scores, [`p${currentPlayer}`]: scores[`p${currentPlayer}`] + 1 };
            const factData = { emoji: cards[first].emoji, name: cards[first].name, fact: cards[first].fact };
            setMatched(newMatched); setScores(newScores); setShowFact(factData);
            setCollection((prev) => ({
              ...prev,
              [theme]: { ...(prev[theme] || {}), [cards[first].name]: cards[first] },
            }));
            const isGameOver = newMatched.length === cards.length;
            await updateRoom({
              flipped: [], matched: newMatched, scores: newScores,
              gameOver: isGameOver, lastFact: factData, turnStartTime: Date.now(),
            });
            setFlipped([]); setIsChecking(false);
            turnStartTimeRef.current = Date.now();
            setTimeLeft(levels[level].timer);
            if (isGameOver) {
              setTimeout(() => {
                playSound('win'); setScreen('win');
                if (roomRefRef.current) { off(roomRefRef.current); roomRefRef.current = null; }
              }, 1500);
            }
          }, 600);
        } else {
          setTimeout(async () => {
            playSound('noMatch');
            const newPlayer = currentPlayer === 1 ? 2 : 1;
            setCurrentPlayer(newPlayer); setFlipped([]); setIsChecking(false);
            turnStartTimeRef.current = Date.now();
            setTimeLeft(levels[level].timer);
            await updateRoom({ flipped: [], currentPlayer: newPlayer, turnStartTime: Date.now() });
          }, 1200);
        }
      }
      return;
    }

    playSound('flip');
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      setMoves(moves + 1); setIsChecking(true);
      const [first, second] = newFlipped;
      if (cards[first].name === cards[second].name) {
        setTimeout(() => {
          playSound('match');
          setMatched([...matched, first, second]);
          setShowFact({ emoji: cards[first].emoji, name: cards[first].name, fact: cards[first].fact });
          setCollection((prev) => ({
            ...prev,
            [theme]: { ...(prev[theme] || {}), [cards[first].name]: cards[first] },
          }));
          if (mode === 'twoPlayer') {
            setScores((prev) => ({ ...prev, [`p${currentPlayer}`]: prev[`p${currentPlayer}`] + 1 }));
          }
          setFlipped([]); setIsChecking(false);
        }, 600);
      } else {
        setTimeout(() => {
          playSound('noMatch'); setFlipped([]); setIsChecking(false);
          if (mode === 'twoPlayer') setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
        }, 1200);
      }
    }
  };

  useEffect(() => {
    if (mode === 'online') return;
    if (cards.length > 0 && matched.length === cards.length) {
      const totalPairs = cards.length / 2;
      const earnedStars = moves <= totalPairs + 2 ? 3 : moves <= totalPairs + 5 ? 2 : 1;
      setTimeout(() => {
        playSound('win'); setStars(earnedStars);
        if (mode === 'daily') setDailyDoneDate(todayDateString());
        setScreen('win');
      }, 1500);
    }
  }, [matched, cards, moves, mode]);

  const closeFact = () => { tap('click'); setShowFact(null); };
  const currentTheme = themes[theme];
  const bgClass = currentTheme.bg;

  const safeAreaStyle = {
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'env(safe-area-inset-bottom)',
    paddingLeft: 'env(safe-area-inset-left)',
    paddingRight: 'env(safe-area-inset-right)',
  };

  // ============ SCREENS ============
  if (screen === 'home') {
    const daily = getDailyChallenge();
    const totalCollected = Object.values(collection).reduce((sum, c) => sum + Object.keys(c).length, 0);
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-orange-300 flex flex-col items-center justify-center p-4" style={safeAreaStyle}>
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center relative">
          <div className="absolute top-4 right-4">
            <button onClick={() => { tap('click'); setSoundOn(!soundOn); }} className="bg-purple-100 p-2 rounded-full hover:bg-purple-200">
              {soundOn ? <Volume2 className="w-5 h-5 text-purple-600" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
            </button>
          </div>
          <div className="text-7xl mb-4 animate-bounce">🦊</div>
          <h1 className="text-4xl font-bold text-purple-600 mb-2">Memory Match!</h1>
          <p className="text-lg text-gray-600 mb-6">Hi friend! I'm Foxy! 🦊</p>
          <div className="space-y-3">
            <button onClick={() => { tap('click'); setScreen('themeSelect'); }} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold py-4 px-6 rounded-2xl shadow-lg hover:scale-105 transform transition-all flex items-center justify-center gap-2">
              <Star className="w-6 h-6" /> Solo Play
            </button>
            <button onClick={() => { tap('click'); setScreen('twoPlayerSetup'); }} className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl font-bold py-4 px-6 rounded-2xl shadow-lg hover:scale-105 transform transition-all flex items-center justify-center gap-2">
              <Users className="w-6 h-6" /> 2 Players (Same Device)
            </button>
            <button onClick={() => { tap('click'); setScreen('onlineMenu'); }} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xl font-bold py-4 px-6 rounded-2xl shadow-lg hover:scale-105 transform transition-all flex items-center justify-center gap-2">
              <Wifi className="w-6 h-6" /> Online (2 Devices)
            </button>
            <button onClick={() => { tap('click'); if (!dailyDone) startGame('medium', daily.theme, 'daily'); }} disabled={dailyDone} className={`w-full ${dailyDone ? 'bg-gray-300' : 'bg-gradient-to-r from-yellow-400 to-orange-500'} text-white text-xl font-bold py-4 px-6 rounded-2xl shadow-lg ${!dailyDone && 'hover:scale-105'} transform transition-all flex items-center justify-center gap-2`}>
              <Calendar className="w-6 h-6" /> {dailyDone ? 'Daily Done! ✓' : "Today's Challenge"}
            </button>
            <button onClick={() => { tap('click'); setScreen('collection'); }} className="w-full bg-gradient-to-r from-green-400 to-teal-500 text-white text-xl font-bold py-4 px-6 rounded-2xl shadow-lg hover:scale-105 transform transition-all flex items-center justify-center gap-2">
              <Book className="w-6 h-6" /> My Book ({totalCollected})
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'onlineMenu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 flex flex-col items-center justify-center p-4" style={safeAreaStyle}>
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-6xl mb-2">🌐</div>
            <h2 className="text-3xl font-bold text-purple-600">Play Online!</h2>
            <p className="text-gray-600 mt-2 text-sm">Play with a friend on another device!</p>
          </div>
          <button onClick={() => { tap('click'); setScreen('createRoomSetup'); }} className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:scale-105 text-white text-xl font-bold py-4 px-6 rounded-2xl shadow-md transition-all mb-3">
            🎮 Create Room
          </button>
          <button onClick={() => { tap('click'); setScreen('joinRoom'); }} className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:scale-105 text-white text-xl font-bold py-4 px-6 rounded-2xl shadow-md transition-all mb-3">
            🔑 Join Room
          </button>
          <button onClick={() => { tap('click'); setScreen('home'); setConnectionError(''); }} className="w-full text-purple-600 font-semibold py-2 hover:text-purple-800 mt-2">← Back</button>
        </div>
      </div>
    );
  }

  if (screen === 'createRoomSetup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 flex flex-col items-center justify-center p-4" style={safeAreaStyle}>
        <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full">
          <div className="text-center mb-4"><h2 className="text-2xl font-bold text-purple-600">Setup Your Room</h2></div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">Theme:</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {Object.entries(themes).map(([key, info]) => (
              <button key={key} onClick={() => { tap('click'); setTheme(key); }} className={`p-3 rounded-xl font-bold transition-all ${theme === key ? `bg-gradient-to-br ${info.bg} text-white scale-105 shadow-lg` : 'bg-gray-100 text-gray-700'}`}>
                <div className="text-2xl mb-1">{info.emoji}</div><div className="text-xs">{info.label}</div>
              </button>
            ))}
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">Level (timer per turn):</h3>
          <div className="space-y-2 mb-4">
            {Object.entries(levels).map(([key, info]) => (
              <button key={key} onClick={() => { tap('click'); createRoom(key, theme); }} disabled={connectionStatus === 'connecting'} className={`w-full ${connectionStatus === 'connecting' ? 'bg-gray-300' : 'bg-gradient-to-r from-blue-400 to-purple-500 hover:scale-105'} text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-between`}>
                <span>{info.label}</span>
                <span className="flex items-center gap-1 text-sm"><Clock className="w-4 h-4" /> {info.timer}s</span>
              </button>
            ))}
          </div>
          {connectionStatus === 'connecting' && <div className="bg-blue-100 text-blue-700 text-sm font-bold p-3 rounded-xl mb-3 text-center">🔄 Creating room...</div>}
          {connectionError && <div className="bg-red-100 text-red-700 text-sm font-bold p-3 rounded-xl mb-3 text-center">{connectionError}</div>}
          <button onClick={() => { tap('click'); setScreen('onlineMenu'); setConnectionError(''); }} className="w-full text-purple-600 font-semibold py-2 hover:text-purple-800">← Back</button>
        </div>
      </div>
    );
  }

  if (screen === 'onlineWaiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 flex flex-col items-center justify-center p-4" style={safeAreaStyle}>
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <h2 className="text-2xl font-bold text-purple-600 mb-2">Waiting for friend...</h2>
          <p className="text-gray-600 mb-6">Share this code with your friend:</p>
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-6 mb-4">
            <div className="text-5xl font-bold text-purple-700 tracking-widest mb-3">{roomCode}</div>
            <button onClick={copyRoomCode} className="bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 mx-auto hover:bg-purple-600">
              <Copy className="w-4 h-4" /> Copy Code
            </button>
          </div>
          <div className="text-sm text-gray-500 mb-6">
            Theme: {themes[theme].emoji} {themes[theme].label}<br/>
            Level: {levels[level].label} ({levels[level].timer}s per turn)
          </div>
          {connectionError && <div className="bg-red-100 text-red-700 text-sm font-bold p-3 rounded-xl mb-4">{connectionError}</div>}
          <button onClick={leaveRoom} className="w-full bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl hover:bg-gray-300">Cancel</button>
        </div>
      </div>
    );
  }

  if (screen === 'joinRoom') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 flex flex-col items-center justify-center p-4" style={safeAreaStyle}>
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-6xl mb-2">🔑</div>
            <h2 className="text-2xl font-bold text-purple-600">Join a Room</h2>
            <p className="text-gray-600 mt-2 text-sm">Enter your friend's 4-digit code</p>
          </div>
          <input type="text" inputMode="numeric" maxLength={4} value={joinCode}
            onChange={(e) => { setJoinCode(e.target.value.replace(/\D/g, '')); setConnectionError(''); }}
            className="w-full text-center text-4xl font-bold tracking-widest py-4 border-4 border-purple-200 rounded-2xl mb-4 focus:outline-none focus:border-purple-500"
            placeholder="0000" />
          {connectionError && <div className="bg-red-100 text-red-700 text-sm font-bold p-3 rounded-xl mb-4 text-center">{connectionError}</div>}
          {connectionStatus === 'connecting' && <div className="bg-blue-100 text-blue-700 text-sm font-bold p-3 rounded-xl mb-4 text-center">🔄 Connecting...</div>}
          <button onClick={() => { tap('click'); joinRoom(joinCode); }} disabled={joinCode.length !== 4 || connectionStatus === 'connecting'}
            className={`w-full ${joinCode.length === 4 && connectionStatus !== 'connecting' ? 'bg-gradient-to-r from-green-500 to-teal-500 hover:scale-105' : 'bg-gray-300'} text-white text-xl font-bold py-4 rounded-2xl shadow-md transition-all mb-3`}>
            Join Game
          </button>
          <button onClick={() => { tap('click'); leaveRoom(); }} className="w-full text-purple-600 font-semibold py-2 hover:text-purple-800">← Back</button>
        </div>
      </div>
    );
  }

  if (screen === 'themeSelect') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-orange-300 flex flex-col items-center justify-center p-4" style={safeAreaStyle}>
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6"><div className="text-6xl mb-2">🎨</div><h2 className="text-3xl font-bold text-purple-600">Pick a Theme!</h2></div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {Object.entries(themes).map(([key, info]) => (
              <button key={key} onClick={() => { tap('click'); setTheme(key); setScreen('levelSelect'); }} className={`bg-gradient-to-br ${info.bg} text-white text-lg font-bold py-6 px-4 rounded-2xl shadow-md hover:scale-105 transform transition-all`}>
                <div className="text-4xl mb-2">{info.emoji}</div><div>{info.label}</div>
              </button>
            ))}
          </div>
          <button onClick={() => { tap('click'); setScreen('home'); }} className="mt-4 w-full text-purple-600 font-semibold py-2 hover:text-purple-800">← Back</button>
        </div>
      </div>
    );
  }

  if (screen === 'levelSelect') {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${bgClass} flex flex-col items-center justify-center p-4`} style={safeAreaStyle}>
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-6xl mb-2">{currentTheme.emoji}</div>
            <h2 className="text-3xl font-bold text-purple-600">Pick a Level!</h2>
            <p className="text-gray-500 mt-1">Theme: {currentTheme.label}</p>
          </div>
          <div className="space-y-3">
            {Object.entries(levels).map(([key, info]) => (
              <button key={key} onClick={() => { tap('click'); startGame(key, theme, 'solo'); }} className="w-full bg-gradient-to-r from-blue-400 to-purple-500 text-white text-xl font-bold py-4 px-6 rounded-2xl shadow-md hover:scale-105 transform transition-all flex items-center justify-between">
                <span>{info.label}</span>
                <span className="flex">{[...Array(info.stars)].map((_, i) => (<Star key={i} className="w-5 h-5 fill-yellow-300 text-yellow-300" />))}</span>
              </button>
            ))}
          </div>
          <button onClick={() => { tap('click'); setScreen('themeSelect'); }} className="mt-6 w-full text-purple-600 font-semibold py-2 hover:text-purple-800">← Back</button>
        </div>
      </div>
    );
  }

  if (screen === 'twoPlayerSetup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex flex-col items-center justify-center p-4" style={safeAreaStyle}>
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-6xl mb-2">👫</div>
            <h2 className="text-3xl font-bold text-purple-600">2 Players (Same Device)</h2>
            <p className="text-gray-600 mt-2 text-sm">Take turns to match pairs!</p>
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">Theme:</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {Object.entries(themes).map(([key, info]) => (
              <button key={key} onClick={() => { tap('click'); setTheme(key); }} className={`p-3 rounded-xl font-bold transition-all ${theme === key ? `bg-gradient-to-br ${info.bg} text-white scale-105 shadow-lg` : 'bg-gray-100 text-gray-700'}`}>
                <div className="text-2xl mb-1">{info.emoji}</div><div className="text-xs">{info.label}</div>
              </button>
            ))}
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">Level:</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {Object.entries(levels).map(([key, info]) => (
              <button key={key} onClick={() => { tap('click'); startGame(key, theme, 'twoPlayer'); }} className="bg-gradient-to-r from-blue-400 to-purple-500 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:scale-105 transition-all">
                {info.label}
              </button>
            ))}
          </div>
          <button onClick={() => { tap('click'); setScreen('home'); }} className="w-full text-purple-600 font-semibold py-2 hover:text-purple-800">← Back</button>
        </div>
      </div>
    );
  }

  if (screen === 'collection') {
    const totalPossible = Object.values(themes).reduce((sum, t) => sum + t.items.length, 0);
    const totalCollected = Object.values(collection).reduce((sum, c) => sum + Object.keys(c).length, 0);
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-300 via-teal-300 to-blue-300 p-4" style={safeAreaStyle}>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => { tap('click'); setScreen('home'); }} className="bg-purple-500 text-white p-2 rounded-full hover:bg-purple-600"><Home className="w-5 h-5" /></button>
              <h2 className="text-3xl font-bold text-purple-600 flex items-center gap-2"><Book className="w-8 h-8" /> My Book</h2>
              <div className="bg-yellow-100 px-3 py-1 rounded-full font-bold text-yellow-700">{totalCollected}/{totalPossible}</div>
            </div>
            <p className="text-gray-600 text-center">All the cool facts you've discovered!</p>
          </div>
          {Object.entries(themes).map(([themeKey, themeInfo]) => {
            const themeCollection = collection[themeKey] || {};
            return (
              <div key={themeKey} className="bg-white rounded-3xl shadow-lg p-5 mb-4">
                <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                  <span className="text-3xl">{themeInfo.emoji}</span>
                  <span className="text-purple-600">{themeInfo.label}</span>
                  <span className="ml-auto text-sm bg-purple-100 text-purple-600 px-2 py-1 rounded-full">{Object.keys(themeCollection).length}/{themeInfo.items.length}</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {themeInfo.items.map((item) => {
                    const found = themeCollection[item.name];
                    return (
                      <div key={item.name} className={`rounded-xl p-3 text-center ${found ? `bg-gradient-to-br ${themeInfo.bg}` : 'bg-gray-200'}`}>
                        <div className="text-3xl mb-1">{found ? item.emoji : <Lock className="w-7 h-7 mx-auto text-gray-400" />}</div>
                        <div className={`text-xs font-bold ${found ? 'text-white' : 'text-gray-500'}`}>{found ? item.name : '???'}</div>
                        {found && <div className="text-xs text-white mt-1 leading-tight">{item.fact}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (screen === 'win') {
    const messages = ["Amazing job! Your memory is super strong! 🌟", "Wow! You're a memory champion! 🏆", "Fantastic! Your brain is growing stronger! 💪"];
    const msg = stars === 3 ? messages[1] : stars === 2 ? messages[0] : messages[2];
    let winnerText = '';
    if (mode === 'twoPlayer' || mode === 'online') {
      if (scores.p1 > scores.p2) {
        winnerText = mode === 'online' && playerNumber === 1 ? '🏆 You Win!' : mode === 'online' && playerNumber === 2 ? '😊 Player 1 Wins!' : '🏆 Player 1 Wins!';
      } else if (scores.p2 > scores.p1) {
        winnerText = mode === 'online' && playerNumber === 2 ? '🏆 You Win!' : mode === 'online' && playerNumber === 1 ? '😊 Player 2 Wins!' : '🏆 Player 2 Wins!';
      } else {
        winnerText = "🤝 It's a Tie!";
      }
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-orange-400 to-pink-400 flex flex-col items-center justify-center p-4" style={safeAreaStyle}>
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-7xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-4xl font-bold text-purple-600 mb-4">Game Over!</h2>
          {(mode === 'twoPlayer' || mode === 'online') ? (
            <div className="mb-6">
              <p className="text-2xl font-bold text-orange-600 mb-3">{winnerText}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className={`bg-blue-100 rounded-2xl p-3 ${mode === 'online' && playerNumber === 1 ? 'ring-4 ring-blue-400' : ''}`}>
                  <div className="text-sm text-gray-600">Player 1{mode === 'online' && playerNumber === 1 ? ' (You)' : ''}</div>
                  <div className="text-3xl font-bold text-blue-600">{scores.p1}</div>
                </div>
                <div className={`bg-pink-100 rounded-2xl p-3 ${mode === 'online' && playerNumber === 2 ? 'ring-4 ring-pink-400' : ''}`}>
                  <div className="text-sm text-gray-600">Player 2{mode === 'online' && playerNumber === 2 ? ' (You)' : ''}</div>
                  <div className="text-3xl font-bold text-pink-600">{scores.p2}</div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-6 gap-2">
                {[1, 2, 3].map((i) => (<Star key={i} className={`w-16 h-16 ${i <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />))}
              </div>
              <p className="text-xl text-gray-700 mb-2">{msg}</p>
              <p className="text-gray-500 mb-6">You finished in {moves} moves!</p>
            </>
          )}
          {mode === 'daily' && (
            <div className="bg-yellow-100 border-2 border-yellow-300 rounded-2xl p-3 mb-4">
              <p className="text-yellow-800 font-bold">🌟 Daily Challenge Complete!</p>
              <p className="text-sm text-yellow-700">Come back tomorrow for a new one!</p>
            </div>
          )}
          <div className="space-y-3">
            {mode !== 'daily' && mode !== 'online' && (
              <button onClick={() => { tap('click'); startGame(level, theme, mode); }} className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white text-xl font-bold py-3 px-6 rounded-2xl shadow-md hover:scale-105 transform transition-all flex items-center justify-center gap-2">
                <RotateCcw className="w-6 h-6" /> Play Again
              </button>
            )}
            <button onClick={() => { tap('click'); if (mode === 'online') leaveRoom(); else setScreen('home'); }} className="w-full bg-gradient-to-r from-purple-400 to-pink-500 text-white text-xl font-bold py-3 px-6 rounded-2xl shadow-md hover:scale-105 transform transition-all flex items-center justify-center gap-2">
              <Home className="w-5 h-5" /> Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // GAME SCREEN
  const isMyTurn = mode !== 'online' || currentPlayer === playerNumber;
  const timerColor = timeLeft <= 5 ? 'text-red-500' : timeLeft <= 10 ? 'text-orange-500' : 'text-green-600';
  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgClass} p-4`} style={safeAreaStyle}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => { tap('click'); if (mode === 'online') leaveRoom(); else setScreen('home'); }} className="bg-purple-500 text-white p-2 rounded-full hover:bg-purple-600">
              <Home className="w-5 h-5" />
            </button>
            {(mode === 'twoPlayer' || mode === 'online') ? (
              <div className="flex gap-3">
                <div className={`px-3 py-1 rounded-xl ${currentPlayer === 1 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <div className="text-xs">P1{mode === 'online' && playerNumber === 1 ? ' (You)' : ''}</div>
                  <div className="font-bold">{scores.p1}</div>
                </div>
                <div className={`px-3 py-1 rounded-xl ${currentPlayer === 2 ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <div className="text-xs">P2{mode === 'online' && playerNumber === 2 ? ' (You)' : ''}</div>
                  <div className="font-bold">{scores.p2}</div>
                </div>
              </div>
            ) : (
              <div className="flex gap-4">
                <div className="text-center"><div className="text-xs text-gray-500">Moves</div><div className="text-xl font-bold text-purple-600">{moves}</div></div>
                <div className="text-center"><div className="text-xs text-gray-500">Found</div><div className="text-xl font-bold text-pink-600">{matched.length / 2}/{cards.length / 2}</div></div>
              </div>
            )}
            <button onClick={() => { tap('click'); setSoundOn(!soundOn); }} className="bg-purple-100 p-2 rounded-full hover:bg-purple-200">
              {soundOn ? <Volume2 className="w-5 h-5 text-purple-600" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
            </button>
          </div>
          {mode === 'online' && (
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-2 mt-2">
              <div className="text-sm font-bold flex items-center gap-2">
                {connectionStatus === 'connected' ? (isMyTurn ? <span className="text-green-600">⚡ Your Turn!</span> : <span className="text-gray-500">⏳ Friend's Turn...</span>) : <span className="text-red-500 flex items-center gap-1"><WifiOff className="w-4 h-4" /> Disconnected</span>}
              </div>
              <div className={`flex items-center gap-1 font-bold text-lg ${timerColor}`}><Clock className="w-5 h-5" /> {timeLeft}s</div>
            </div>
          )}
          {mode === 'twoPlayer' && (
            <div className="text-center text-sm font-bold text-purple-600">{currentPlayer === 1 ? "Player 1's Turn 🔵" : "Player 2's Turn 🌸"}</div>
          )}
          {mode === 'daily' && (
            <div className="text-center text-sm font-bold text-orange-600 flex items-center justify-center gap-1"><Calendar className="w-4 h-4" /> Today's Challenge</div>
          )}
        </div>
        <div className={`grid ${levels[level].grid} gap-3`}>
          {cards.map((card, index) => {
            const isFlipped = flipped.includes(index) || matched.includes(index);
            const isMatched = matched.includes(index);
            const disabled = isFlipped || (mode === 'online' && !isMyTurn);
            return (
              <button key={index} onClick={() => handleCardClick(index)} disabled={disabled}
                className={`aspect-square rounded-2xl shadow-lg transform transition-all duration-300 ${isFlipped ? isMatched ? 'bg-gradient-to-br from-green-300 to-green-400 scale-95' : 'bg-gradient-to-br from-yellow-200 to-orange-300' : disabled && mode === 'online' ? 'bg-gradient-to-br from-gray-400 to-gray-500 opacity-70' : 'bg-gradient-to-br from-purple-500 to-pink-500 hover:scale-105'}`}>
                <div className="w-full h-full flex items-center justify-center">
                  {isFlipped ? <span className="text-5xl sm:text-6xl">{card.emoji}</span> : <span className="text-4xl">❓</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {showFact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full text-center">
            <div className="text-6xl mb-3">{showFact.emoji}</div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <h3 className="text-xl font-bold text-purple-600">Cool Fact!</h3>
              <Sparkles className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-lg text-gray-700 mb-4 leading-relaxed">
              <span className="font-bold">{showFact.name}:</span> {showFact.fact}
            </p>
            <div className="bg-green-100 text-green-700 text-sm font-bold py-1 px-3 rounded-full inline-block mb-4">
              <Check className="w-4 h-4 inline mr-1" /> Added to your Book!
            </div>
            <br />
            <button onClick={closeFact} className="bg-gradient-to-r from-green-400 to-blue-500 text-white text-lg font-bold py-2 px-8 rounded-full shadow-md hover:scale-105 transform transition-all">
              Awesome! ✨
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryMatchGame;
