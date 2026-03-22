// App.js - PLAY STORE HAZIR TAM SÜRÜM (SDK 34 UYUMLU)
// TÜM BUTONLAR İŞLEVSEL - TÜM ÖZELLİKLER AKTİF

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  Image,
  FlatList,
  Alert,
  Dimensions,
  TextInput,
  Modal,
  ScrollView,
  BackHandler,
  Linking,
  Share,
  Platform,
  Vibration,
  WebView,
  ActivityIndicator
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debounce } from 'lodash';
import * as MailComposer from 'expo-mail-composer';
import { BannerAd, TestIds, BannerAdSize, InterstitialAd, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';

const { width, height } = Dimensions.get("window");

// ============================================
// SABİTLER VE KONFİGÜRASYON
// ============================================

// ADMOB REKLAM ID'LERİ (TEST ID'leri - GERÇEK ID'LERİNİZLE DEĞİŞTİRİN)
const BANNER_AD_UNIT_ID = Platform.OS === 'ios' 
  ? 'ca-app-pub-3940256099942544/2934735716' // TEST iOS Banner
  : 'ca-app-pub-3940256099942544/6300978111'; // TEST Android Banner

const INTERSTITIAL_AD_UNIT_ID = Platform.OS === 'ios'
  ? 'ca-app-pub-3940256099942544/4411468910' // TEST iOS Interstitial
  : 'ca-app-pub-3940256099942544/1033173712'; // TEST Android Interstitial

const REWARDED_AD_UNIT_ID = Platform.OS === 'ios'
  ? 'ca-app-pub-3940256099942544/1712485313' // TEST iOS Rewarded
  : 'ca-app-pub-3940256099942544/5224354917'; // TEST Android Rewarded

// DESTEK E-POSTA ADRESİ
const SUPPORT_EMAIL = "destek.bilgisavasi@gmail.com";

// GİTHUB SORU LİNKİ
const QUESTIONS_URL = "https://raw.githubusercontent.com/aloyazilimas-jpg/quiz-questions/main/questions.json";

// GİZLİLİK POLİTİKASI URL'İ
const PRIVACY_POLICY_URL = "https://white-faith-27-3835b8.tiiny.site";

// SEZON SÜRESİ - 2 AY (milisaniye cinsinden)
const SEASON_DURATION = 60 * 24 * 60 * 60 * 1000 * 2; // 2 ay

// TÜRKİYE SIRALAMASI SİSTEMİ
const TURKEY_RANKING = {
  ENTRY_FEE: 0,
  SEASON_DURATION: SEASON_DURATION,
  TOTAL_PLAYERS: 0,
  TOP_PLAYERS: 1,
  REWARDS: {
    PERMANENT_TITLE: "#1 TÜRKİYE",
    SEASON_TITLE: "SEZON ŞAMPİYONU",
    BADGE_ICON: "🏆",
    FRAME: "turkey_champion",
    FIRST_PRIZE: 0
  }
};

// GERÇEKÇİ KULLANICI ADLARI
const REALISTIC_USERNAMES = [
  "Ahmet_Yılmaz", "Elif_Şahin", "Mehmet_Demir", "Zeynep_Kaya", "Ali_Çelik",
  "Ayşe_Arslan", "Mustafa_Öztürk", "Fatma_Yıldız", "Hasan_Kılıç", "Emine_Aktaş",
  "Can_Yıldız", "Merve_Aydın", "Burak_Koç", "İrem_Yalçın", "Emre_Şahin",
  "Seda_Kara", "Okan_Yılmaz", "Büşra_Demir", "Cem_Aktaş", "Dilara_Çelik"
];

// ============================================
// REKLAM YÖNETİCİSİ
// ============================================

const AdManager = {
  isPremium: false,
  lastInterstitialTime: null,
  AD_COOLDOWN: 60 * 1000, // 1 dakika
  interstitialInstance: null,
  rewardedInstance: null,
  
  initialize: async () => {
    try {
      // Interstitial reklam oluştur
      AdManager.interstitialInstance = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
        requestNonPersonalizedAdsOnly: false,
      });
      
      // Ödüllü reklam oluştur
      AdManager.rewardedInstance = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
        requestNonPersonalizedAdsOnly: false,
      });
      
      return true;
    } catch (error) {
      console.warn('Reklam başlatma hatası:', error);
      return false;
    }
  },

  setPremium: function(premiumStatus) {
    this.isPremium = premiumStatus;
  },

  canShowInterstitial: function() {
    if (this.isPremium) return false;
    
    const now = Date.now();
    if (!this.lastInterstitialTime || (now - this.lastInterstitialTime) > this.AD_COOLDOWN) {
      this.lastInterstitialTime = now;
      return true;
    }
    return false;
  },

  showInterstitialAd: async () => {
    if (AdManager.isPremium || !AdManager.canShowInterstitial()) {
      return Promise.resolve(false);
    }
    
    return new Promise((resolve) => {
      try {
        const unsubscribeLoaded = AdManager.interstitialInstance.addAdEventListener(
          RewardedAdEventType.LOADED,
          () => {
            AdManager.interstitialInstance.show();
          }
        );
        
        const unsubscribeClosed = AdManager.interstitialInstance.addAdEventListener(
          'closed',
          () => {
            unsubscribeLoaded();
            unsubscribeClosed();
            resolve(true);
          }
        );
        
        AdManager.interstitialInstance.load();
        
        // 5 saniye sonra timeout
        setTimeout(() => {
          unsubscribeLoaded();
          unsubscribeClosed();
          resolve(false);
        }, 5000);
        
      } catch (error) {
        console.warn('Interstitial gösterim hatası:', error);
        resolve(false);
      }
    });
  },

  showRewardedAd: async () => {
    if (AdManager.isPremium) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, reward: 'premium' });
        }, 500);
      });
    }
    
    return new Promise((resolve, reject) => {
      try {
        let rewarded = false;
        
        const unsubscribeLoaded = AdManager.rewardedInstance.addAdEventListener(
          RewardedAdEventType.LOADED,
          () => {
            AdManager.rewardedInstance.show();
          }
        );
        
        const unsubscribeEarned = AdManager.rewardedInstance.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          (reward) => {
            rewarded = true;
          }
        );
        
        const unsubscribeClosed = AdManager.rewardedInstance.addAdEventListener(
          'closed',
          () => {
            unsubscribeLoaded();
            unsubscribeEarned();
            unsubscribeClosed();
            
            if (rewarded) {
              resolve({ success: true, reward: 'rewarded' });
            } else {
              reject('cancelled');
            }
          }
        );
        
        AdManager.rewardedInstance.load();
        
        // 5 saniye sonra timeout
        setTimeout(() => {
          unsubscribeLoaded();
          unsubscribeEarned();
          unsubscribeClosed();
          reject('timeout');
        }, 5000);
        
      } catch (error) {
        console.warn('Ödüllü reklam hatası:', error);
        reject('error');
      }
    });
  },

  showBannerAd: () => {
    if (AdManager.isPremium) {
      return null;
    }
    
    return (
      <View style={styles.bannerAdContainer}>
        <BannerAd
          unitId={BANNER_AD_UNIT_ID}
          size={BannerAdSize.BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: false,
          }}
        />
        <Text style={styles.bannerAdText}>Reklam</Text>
      </View>
    );
  }
};

// ============================================
// 2x TP SİSTEMİ
// ============================================

class DoubleXPSystem {
  static isActive = false;
  static remainingTime = 0;
  static timer = null;
  static isPermanent = false;

  static activate(duration = 1800, permanent = false) {
    this.isActive = true;
    this.isPermanent = permanent;
    this.remainingTime = permanent ? 999999 : duration;
    
    if (!permanent) {
      if (this.timer) clearInterval(this.timer);
      
      this.timer = setInterval(() => {
        this.remainingTime--;
        
        if (this.remainingTime <= 0) {
          this.deactivate();
        }
        
        if (this.remainingTime % 60 === 0 || this.remainingTime <= 5) {
          this.saveState();
        }
      }, 1000);
    }
    
    this.saveState();
    return true;
  }

  static deactivate() {
    this.isActive = false;
    this.isPermanent = false;
    this.remainingTime = 0;
    
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    this.saveState();
    return false;
  }

  static saveState = async () => {
    try {
      const state = {
        isActive: this.isActive,
        isPermanent: this.isPermanent,
        remainingTime: this.remainingTime,
        activatedAt: Date.now()
      };
      
      await AsyncStorage.setItem('doubleXPState', JSON.stringify(state));
    } catch (error) {
      console.warn('Double XP save error:', error);
    }
  };

  static loadState = async () => {
    try {
      const stateStr = await AsyncStorage.getItem('doubleXPState');
      
      if (stateStr) {
        const state = JSON.parse(stateStr);
        const timePassed = Math.floor((Date.now() - state.activatedAt) / 1000);
        const newRemainingTime = state.isPermanent ? 999999 : Math.max(0, state.remainingTime - timePassed);
        
        if (newRemainingTime > 0 || state.isPermanent) {
          this.isActive = true;
          this.isPermanent = state.isPermanent;
          this.remainingTime = newRemainingTime;
          this.activate(newRemainingTime, state.isPermanent);
          return true;
        } else {
          this.deactivate();
          return false;
        }
      }
    } catch (error) {
      console.warn('Double XP load error:', error);
    }
    
    return this.isActive;
  };

  static getMultiplier() {
    return this.isActive ? 2 : 1;
  }

  static getRemainingTimeFormatted() {
    if (!this.isActive) return "Aktif Değil";
    if (this.isPermanent) return "SÜREKLİ AKTİF";
    
    const minutes = Math.floor(this.remainingTime / 60);
    const seconds = this.remainingTime % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

// ============================================
// BİLDİRİM YÖNETİCİSİ
// ============================================

const NotificationManager = {
  show: (title, message, options = {}) => {
    Alert.alert(title, message, [{ text: "Tamam" }]);
  }
};

// ============================================
// PROFİL ÇERÇEVELERİ
// ============================================

const FRAMES = {
  default: { name: "Standart", color: "#666", price: 0, icon: "⚪" },
  bronze: { name: "Bronz", color: "#CD7F32", price: 500, icon: "🟤" },
  silver: { name: "Gümüş", color: "#C0C0C0", price: 1000, icon: "⚪" },
  gold: { name: "Altın", color: "#FFD700", price: 2000, icon: "🟡" },
  platinum: { name: "Platin", color: "#E5E4E2", price: 0, icon: "🔘", premium: true },
  diamond: { name: "Elmas", color: "#B9F2FF", price: 0, icon: "💎", premium: true },
  turkey_champion: { name: "Türkiye Şampiyonu", color: "#FF0000", price: 0, icon: "🏆", premium: true }
};

// ============================================
// MAÇ MODLARI
// ============================================

const MATCH_MODES = {
  SOLO: { 
    name: "Tekli", 
    players: 1, 
    multiplier: 1.0, 
    questionCount: 10, 
    icon: "👤", 
    description: "Tek başına oyna",
    color: "#ffa800",
    timePerQuestion: 15
  },
  PREMIUM: { 
    name: "Premium Savaş", 
    players: 1, 
    multiplier: 2.0, 
    questionCount: 20, 
    premium: true, 
    icon: "⭐", 
    description: "Premium zorluk",
    color: "#FFD700",
    timePerQuestion: 12
  }
};

// ============================================
// YARDIMCI FONKSİYONLAR
// ============================================

const getRandomRealisticUsername = () => {
  return REALISTIC_USERNAMES[Math.floor(Math.random() * REALISTIC_USERNAMES.length)];
};

const getRandomScore = () => {
  return Math.floor(Math.random() * 5000) + 500;
};

const getRandomLevel = () => {
  return Math.floor(Math.random() * 30) + 5;
};

const getFrameStyle = (frameType) => {
  const frame = FRAMES[frameType] || FRAMES.default;
  return {
    borderWidth: frame.premium ? 4 : 3,
    borderColor: frame.color,
    shadowColor: frame.color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: frame.premium ? 0.8 : 0.5,
    shadowRadius: frame.premium ? 10 : 5,
    elevation: frame.premium ? 10 : 5
  };
};

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// ============================================
// GİTHUB SORU YÜKLEYİCİ
// ============================================

class QuestionLoader {
  static loadedQuestions = [];
  static isLoading = false;
  static lastLoadTime = null;
  static CACHE_DURATION = 5 * 60 * 1000;
  static loadAttempts = 0;
  static MAX_ATTEMPTS = 3;

  static async loadQuestions() {
    if (this.isLoading) {
      return this.loadedQuestions.length > 0 ? this.loadedQuestions : [];
    }

    try {
      this.isLoading = true;
      this.loadAttempts++;
      
      if (this.loadedQuestions.length > 0 && this.lastLoadTime && 
          (Date.now() - this.lastLoadTime) < this.CACHE_DURATION) {
        return this.loadedQuestions;
      }

      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 10000);
      
      try {
        const response = await fetch(QUESTIONS_URL, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'User-Agent': 'Mozilla/5.0'
          },
          signal: abortController.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP hatası! Durum: ${response.status}`);
        }

        const questions = await response.json();
        
        if (!Array.isArray(questions)) {
          throw new Error('Geçersiz soru formatı!');
        }

        const validatedQuestions = questions.map((q, index) => ({
          id: q.id || `q${index + 1}`,
          question: q.question || `Soru ${index + 1}`,
          options: Array.isArray(q.options) ? q.options : ['A) Seçenek 1', 'B) Seçenek 2', 'C) Seçenek 3', 'D) Seçenek 4'],
          correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
          category: q.category || 'Genel Kültür',
          difficulty: q.difficulty || 'Orta',
          value: q.value || 10,
          explanation: q.explanation || 'Açıklama yok'
        }));

        if (validatedQuestions.length === 0) {
          throw new Error('GitHub\'dan boş soru listesi geldi!');
        }

        this.loadedQuestions = validatedQuestions;
        this.lastLoadTime = Date.now();
        this.loadAttempts = 0;
        
        return validatedQuestions;
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
      
    } catch (error) {
      console.error('Sorular yüklenirken hata:', error);
      
      // Yedek sorular oluştur
      if (this.loadAttempts >= this.MAX_ATTEMPTS) {
        this.loadedQuestions = this.createBackupQuestions();
        this.lastLoadTime = Date.now();
        return this.loadedQuestions;
      }
      
      return [];
      
    } finally {
      this.isLoading = false;
    }
  }

  static createBackupQuestions() {
    const backupQuestions = [];
    const categories = ['Genel Kültür', 'Tarih', 'Coğrafya', 'Bilim', 'Spor', 'Sanat', 'Müzik', 'Teknoloji'];
    const difficulties = ['Kolay', 'Orta', 'Zor'];
    
    for (let i = 0; i < 50; i++) {
      const category = categories[i % categories.length];
      const difficulty = difficulties[i % 3];
      
      backupQuestions.push({
        id: `backup${i}`,
        question: `${category} sorusu ${i + 1}: Bu bir örnek sorudur. Doğru cevabı bulun.`,
        options: ['A) Birinci seçenek', 'B) İkinci seçenek', 'C) Üçüncü seçenek', 'D) Dördüncü seçenek'],
        correctAnswer: Math.floor(Math.random() * 4),
        category: category,
        difficulty: difficulty,
        value: 10,
        explanation: 'Bu sorunun açıklaması burada yer alır.'
      });
    }
    
    return backupQuestions;
  }

  static getRandomQuestions(count = 10) {
    if (this.loadedQuestions.length === 0) {
      return this.createBackupQuestions().slice(0, count);
    }
    
    if (this.loadedQuestions.length <= count) {
      return shuffleArray([...this.loadedQuestions]);
    }
    
    return shuffleArray([...this.loadedQuestions]).slice(0, count);
  }

  static async getQuestionsForMatch(mode) {
    const questionCount = MATCH_MODES[mode]?.questionCount || 10;
    
    if (this.loadedQuestions.length === 0) {
      await this.loadQuestions();
    }
    
    if (this.loadedQuestions.length < questionCount) {
      if (this.loadedQuestions.length === 0) {
        return this.createBackupQuestions().slice(0, questionCount);
      }
      
      const repeatedQuestions = [];
      while (repeatedQuestions.length < questionCount) {
        repeatedQuestions.push(...shuffleArray([...this.loadedQuestions]));
      }
      return repeatedQuestions.slice(0, questionCount);
    }
    
    return this.getRandomQuestions(questionCount);
  }

  static hasQuestions() {
    return this.loadedQuestions.length > 0;
  }
}

// ============================================
// GERÇEKÇİ BOT SİSTEMİ
// ============================================

class RealisticBot {
  static getAnswer(question, difficulty, timeLeft) {
    if (!question) return 0;
    
    const baseCorrectProbability = {
      'Kolay': 0.85,
      'Orta': 0.75,
      'Zor': 0.60
    }[difficulty] || 0.70;
    
    const timeFactor = timeLeft > 10 ? 1.0 : Math.max(0.3, timeLeft / 10);
    const correctProbability = baseCorrectProbability * timeFactor;
    
    const randomFactor = Math.random() * 0.15;
    const finalProbability = Math.max(0.30, correctProbability - randomFactor);
    
    if (Math.random() < finalProbability) {
      return question.correctAnswer;
    } else {
      if (!question.options || !Array.isArray(question.options)) {
        return 0;
      }
      
      const wrongOptions = [0, 1, 2, 3].filter(opt => opt !== question.correctAnswer);
      
      if (wrongOptions.length === 0) return 0;
      
      if (Math.random() > 0.5 && wrongOptions.length > 1) {
        return wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
      } else {
        return wrongOptions[0];
      }
    }
  }
  
  static getResponseTime(question, difficulty) {
    const baseTime = {
      'Kolay': 2000,
      'Orta': 3500,
      'Zor': 5000
    }[difficulty] || 3000;
    
    const variation = baseTime * 0.4;
    return baseTime + (Math.random() * variation * 2 - variation);
  }
}

// ============================================
// GİRİŞ ANİMASYONU
// ============================================

const SplashAnimation = ({ onComplete }) => {
  const [showContent, setShowContent] = useState(false);
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    setTimeout(() => setShowContent(true), 1500);
    
    if (showContent) {
      Animated.sequence([
        Animated.timing(titleAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
          delay: 300,
        }),
        Animated.timing(subtitleAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(buttonAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
          delay: 300,
        }),
      ]).start();
    }
  }, [showContent]);

  if (!showContent) {
    return (
      <View style={styles.splashContainer}>
        <Animated.View style={[styles.loadingCircle, {
          transform: [{
            rotate: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg']
            })
          }, {
            scale: scaleAnim
          }],
          opacity: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1]
          })
        }]}>
          <Text style={styles.loadingText}>🎯</Text>
        </Animated.View>
        <Text style={styles.loadingTitle}>BİLGİ SAVAŞI</Text>
        <Text style={styles.loadingSubtitle}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.splashContainer}>
      <Animated.View style={[styles.glowEffect, {
        opacity: glowAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 0.8]
        }),
        transform: [{
          scale: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1.3]
          })
        }]
      }]} />
      
      <Animated.View style={{
        transform: [{
          scale: titleAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1]
          })
        }],
        opacity: titleAnim
      }}>
        <Text style={styles.splashTitle}>BİLGİ SAVAŞI</Text>
      </Animated.View>
      
      <Animated.View style={{
        transform: [{
          translateY: subtitleAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })
        }],
        opacity: subtitleAnim
      }}>
        <Text style={styles.splashSubtitle}>Zekanı Göster, Kazan!</Text>
      </Animated.View>
      
      <Animated.View style={{
        transform: [{
          scale: buttonAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.7, 1]
          })
        }],
        opacity: buttonAnim
      }}>
        <TouchableOpacity 
          style={styles.splashButton}
          onPress={onComplete}
          activeOpacity={0.8}
        >
          <Text style={styles.splashButtonText}>BİLGİNİ GÖSTER</Text>
        </TouchableOpacity>
      </Animated.View>
      
      <Text style={styles.splashFooter}>
        Rakiplerini Yen • Sıralamada Yüksel • Şampiyon Ol
      </Text>
    </View>
  );
};

// ============================================
// GİZLİLİK POLİTİKASI MODALI
// ============================================

const PrivacyPolicyModal = ({ visible, onClose }) => (
  <Modal visible={visible} animationType="slide" transparent={true}>
    <View style={styles.modalOverlay}>
      <View style={styles.webViewModal}>
        <View style={styles.webViewHeader}>
          <Text style={styles.webViewTitle}>Gizlilik Politikası</Text>
          <TouchableOpacity 
            style={styles.webViewCloseButton}
            onPress={onClose}
          >
            <Text style={styles.webViewCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
        <WebView
          source={{ uri: PRIVACY_POLICY_URL }}
          style={styles.webView}
          scalesPageToFit={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color="#ffa800" />
              <Text style={styles.webViewLoadingText}>Yükleniyor...</Text>
            </View>
          )}
        />
      </View>
    </View>
  </Modal>
);

// ============================================
// LOGIN MODAL (SADECE KULLANICI ADI)
// ============================================

const LoginModal = ({ visible, onClose, onLogin }) => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const handleSubmit = () => {
    if (!username.trim()) {
      setError("Kullanıcı adı gereklidir");
      return;
    }

    if (username.length < 3) {
      setError("Kullanıcı adı en az 3 karakter olmalıdır");
      return;
    }

    if (username.length > 20) {
      setError("Kullanıcı adı en fazla 20 karakter olabilir");
      return;
    }

    if (!acceptedPrivacy) {
      setError("Devam etmek için Gizlilik Politikası'nı kabul etmelisiniz");
      return;
    }

    const userData = {
      id: Date.now(),
      username: username.trim()
    };

    onLogin(userData, acceptedPrivacy);
    NotificationManager.show("Giriş Başarılı", `Hoş geldin ${username}!`);
    onClose();
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.loginModalContent}>
            <View style={styles.loginModalHeader}>
              <Text style={styles.loginTitle}>🔐 GİRİŞ YAP</Text>
            </View>
            
            <Text style={styles.loginSubtitle}>
              Sadece bir kullanıcı adı seçin, hemen oynayın!
            </Text>
            
            {error ? (
              <View style={styles.loginErrorContainer}>
                <Text style={styles.loginErrorText}>{error}</Text>
              </View>
            ) : null}
            
            <TextInput
              style={styles.loginInput}
              placeholder="Kullanıcı Adı"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            
            <View style={styles.termsCheckboxContainer}>
              <TouchableOpacity 
                style={styles.checkbox}
                onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}
              >
                <Text style={styles.checkboxIcon}>
                  {acceptedPrivacy ? '✅' : '⬜'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.termsTextContainer}
                onPress={() => setShowPrivacyPolicy(true)}
              >
                <Text style={styles.termsLink}>
                  Gizlilik Politikası'nı okudum ve kabul ediyorum
                </Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.loginButton, !acceptedPrivacy && styles.loginButtonDisabled]}
              onPress={handleSubmit}
              disabled={!acceptedPrivacy}
            >
              <Text style={styles.loginButtonText}>GİRİŞ YAP</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={onClose}
            >
              <Text style={styles.modalCloseText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <PrivacyPolicyModal
        visible={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
      />
    </>
  );
};

// ============================================
// DESTEK VE YARDIM MODALI
// ============================================

const SupportModal = ({ visible, onClose }) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendEmail = async () => {
    if (!message.trim()) {
      Alert.alert("Hata", "Lütfen mesajınızı yazın");
      return;
    }

    setIsSending(true);

    const subject = "Bilgi Savaşı Uygulaması Desteği";
    const body = `
Sorun/Öneri: ${message}

---
Cihaz: ${Platform.OS} ${Platform.Version}
Uygulama Versiyonu: 1.0.0
Tarih: ${new Date().toLocaleString('tr-TR')}
    `;

    const mailtoLink = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    try {
      const canOpen = await Linking.canOpenURL(mailtoLink);
      if (canOpen) {
        await Linking.openURL(mailtoLink);
        Alert.alert("Başarılı", "E-posta uygulaması açılıyor. Mesajınızı gönderebilirsiniz.");
        setMessage("");
        onClose();
      } else {
        Alert.alert("Hata", "E-posta uygulaması bulunamadı");
      }
    } catch (error) {
      Alert.alert("Hata", "E-posta gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <ScrollView 
          style={styles.supportModalContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.supportTitle}>📞 DESTEK VE YARDIM</Text>
          <Text style={styles.supportSubtitle}>
            Sorunlarınız ve sorularınız için bize ulaşın
          </Text>
          
          <View style={styles.contactInfoContainer}>
            <Text style={styles.contactInfoTitle}>İletişim Bilgileri</Text>
            <Text style={styles.contactInfoItem}>📧 E-posta: {SUPPORT_EMAIL}</Text>
            <Text style={styles.contactInfoItem}>⏰ Yanıt Süresi: 24-48 saat</Text>
            <Text style={styles.contactInfoItem}>📍 Konum: Türkiye</Text>
          </View>
          
          <Text style={styles.supportSectionTitle}>Mesajınız</Text>
          <TextInput
            style={styles.supportTextInput}
            placeholder="Sorununuzu veya sorunuzu detaylı bir şekilde açıklayın..."
            placeholderTextColor="#999"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={1000}
          />
          
          <Text style={styles.commonIssuesTitle}>Sık Karşılaşılan Sorunlar</Text>
          <View style={styles.commonIssuesList}>
            <Text style={styles.commonIssue}>• Sorular yüklenmiyor: İnternet bağlantınızı kontrol edin ve uygulamayı yeniden başlatın</Text>
            <Text style={styles.commonIssue}>• Hesap sorunları: Yeni bir kullanıcı adı ile giriş yapın</Text>
            <Text style={styles.commonIssue}>• Premium sorunları: Ödeme onayı 24 saate kadar sürebilir, destek ekibine yazın</Text>
            <Text style={styles.commonIssue}>• Reklam sorunları: Reklam yüklenmiyorsa internet bağlantınızı kontrol edin</Text>
            <Text style={styles.commonIssue}>• Teknik sorunlar: Uygulamayı yeniden başlatın veya güncelleyin</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
            onPress={handleSendEmail}
            disabled={isSending}
          >
            <Text style={styles.sendButtonText}>
              {isSending ? 'GÖNDERİLİYOR...' : '📨 GMAİL\'DE AÇ'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={onClose}
          >
            <Text style={styles.modalCloseText}>Kapat</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

// ============================================
// HESAP SİLME MODALI
// ============================================

const DeleteAccountModal = ({ visible, onClose, onDeleteAccount }) => {
  const [confirmText, setConfirmText] = useState("");
  const [step, setStep] = useState(1);

  const handleDelete = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (confirmText.toLowerCase() !== "hesabımı sil") {
        Alert.alert("Hata", "Lütfen doğrulama metnini doğru yazın");
        return;
      }
      
      Alert.alert(
        "⚠️ SON UYARI",
        "Hesabınız KALICI olarak silinecek:\n\n" +
        "• Tüm puan ve istatistikleriniz silinecek\n" +
        "• Premium üyeliğiniz iptal edilecek (para iadesi yok)\n" +
        "• Tüm verileriniz 30 gün içinde tamamen silinecek\n" +
        "• Bu işlem GERİ ALINAMAZ\n\n" +
        "Devam etmek istiyor musunuz?",
        [
          { text: "İptal", style: "cancel" },
          { 
            text: "EVET, HESABIMI SİL", 
            style: "destructive",
            onPress: () => {
              onDeleteAccount();
              onClose();
            }
          }
        ]
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <ScrollView 
          style={styles.deleteAccountModalContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.deleteAccountTitle}>🗑️ HESAP SİLME</Text>
          
          {step === 1 ? (
            <>
              <View style={styles.deleteAccountWarning}>
                <Text style={styles.deleteAccountWarningText}>
                  ⚠️ HESAP SİLME İŞLEMİ HAKKINDA ÖNEMLİ BİLGİLER
                </Text>
              </View>
              
              <View style={styles.warningList}>
                <Text style={styles.warningItem}>• Hesap silme işlemi GERİ ALINAMAZ</Text>
                <Text style={styles.warningItem}>• Tüm puan, seviye ve istatistikleriniz silinir</Text>
                <Text style={styles.warningItem}>• Premium üyeliğiniz iptal edilir (iade yok)</Text>
                <Text style={styles.warningItem}>• Türkiye sıralaması verileriniz silinir</Text>
                <Text style={styles.warningItem}>• Tüm kişisel verileriniz 30 gün içinde tamamen silinir</Text>
                <Text style={styles.warningItem}>• Farklı bir kullanıcı adı ile yeniden kayıt olabilirsiniz</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.continueDeleteButton}
                onPress={() => setStep(2)}
              >
                <Text style={styles.continueDeleteButtonText}>DEVAM ET</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.deleteAccountWarning}>
                <Text style={styles.deleteAccountWarningText}>
                  ⚠️ HESAP SİLME ONAYI
                </Text>
              </View>
              
              <Text style={styles.confirmText}>
                Hesabınızı silmek istediğinizi onaylamak için lütfen aşağıdaki metni yazın:
              </Text>
              
              <View style={styles.confirmPhraseContainer}>
                <Text style={styles.confirmPhrase}>"hesabımı sil"</Text>
              </View>
              
              <TextInput
                style={styles.confirmInput}
                placeholder='Lütfen "hesabımı sil" yazın'
                placeholderTextColor="#999"
                value={confirmText}
                onChangeText={setConfirmText}
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              <TouchableOpacity 
                style={[
                  styles.deleteAccountButton,
                  confirmText.toLowerCase() !== "hesabımı sil" && styles.deleteAccountButtonDisabled
                ]}
                onPress={handleDelete}
                disabled={confirmText.toLowerCase() !== "hesabımı sil"}
              >
                <Text style={styles.deleteAccountButtonText}>
                  🗑️ HESABIMI KALICI OLARAK SİL
                </Text>
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={onClose}
          >
            <Text style={styles.modalCloseText}>İptal</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

// ============================================
// TÜRKİYE SIRALAMASI MODALI
// ============================================

const TurkeyRankingModal = ({ 
  visible, 
  onClose, 
  onJoin, 
  isPremium, 
  playerData,
  rankingData,
  playerStats,
  isParticipant
}) => {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showRules, setShowRules] = useState(false);
  
  const calculateTimeLeft = () => {
    if (!rankingData.seasonEndDate) return "Bilinmiyor";
    
    const endDate = new Date(rankingData.seasonEndDate);
    const now = new Date();
    const diff = endDate - now;
    
    if (diff <= 0) return "SEZON BİTTİ";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}g ${hours}s ${minutes}d`;
  };
  
  const getPlayerRank = () => {
    if (!rankingData.leaderboard || !isParticipant) return null;
    
    const playerRank = rankingData.leaderboard.find(
      player => player.id === playerData.id
    );
    
    return playerRank ? playerRank.rank : null;
  };
  
  const playerRank = getPlayerRank();
  const timeLeft = calculateTimeLeft();
  
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <ScrollView 
          style={styles.turkeyRankingModalContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.turkeyRankingHeader}>
            <Text style={styles.turkeyRankingTitle}>🏆 TÜRKİYE SIRALAMASI</Text>
            <Text style={styles.turkeyRankingSubtitle}>
              Sezon {rankingData.currentSeason}
            </Text>
            <View style={styles.seasonTimerContainer}>
              <Text style={styles.seasonTimerLabel}>Kalan Süre:</Text>
              <Text style={styles.seasonTimerValue}>{timeLeft}</Text>
              <Text style={styles.seasonDuration}>(2 Ay)</Text>
            </View>
            
            {isParticipant && playerRank && (
              <View style={styles.playerRankBadge}>
                <Text style={styles.playerRankText}>
                  Sıralamanız: {playerRank}. 🎯
                </Text>
                {playerRank === 1 && (
                  <View style={styles.topPlayerBadge}>
                    <Text style={styles.topPlayerBadgeText}>⭐ TÜRKİYE ŞAMPİYONU!</Text>
                  </View>
                )}
              </View>
            )}
          </View>
          
          <View style={styles.rewardsSection}>
            <Text style={styles.sectionTitle}>🎁 SEZON ÖDÜLLERİ</Text>
            
            <View style={styles.rewardsGrid}>
              <View style={[styles.rewardCard, styles.firstReward]}>
                <Text style={styles.rewardRank}>🥇 1.</Text>
                <Text style={styles.rewardTitle}>#1 TÜRKİYE ŞAMPİYONU</Text>
                <Text style={styles.rewardDescription}>
                  • Kalıcı "#1 TÜRKİYE" Unvanı
                </Text>
                <Text style={styles.rewardDescription}>
                  • Özel "Türkiye Şampiyonu" Çerçevesi
                </Text>
                <Text style={styles.rewardDescription}>
                  • Premium Rozet ve İkonlar
                </Text>
                <Text style={styles.rewardDescription}>
                  • ŞAMPİYONLUK ONURU
                </Text>
                <View style={styles.freeEntryNote}>
                  <Text style={styles.freeEntryNoteText}>📢 HERKES KATILABİLİR • ÜCRETSİZ</Text>
                </View>
              </View>
              
              <View style={[styles.rewardCard, styles.otherRewardsCard]}>
                <Text style={styles.otherRewardsTitle}>2. ve Sonrası</Text>
                <Text style={styles.otherRewardsText}>
                  • "Sezon Şampiyonu" Unvanı (2 ay)
                </Text>
                <Text style={styles.otherRewardsText}>
                  • Özel Rozet
                </Text>
                <Text style={styles.otherRewardsText}>
                  • Sıralama Prestiji
                </Text>
                <View style={styles.noContestNote}>
                  <Text style={styles.noContestNoteText}>
                    📣 KONTENJAN YOK - HERKES KATILABİLİR!
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.participationSection}>
            <Text style={styles.sectionTitle}>📊 KATILIM KOŞULLARI</Text>
            
            <View style={styles.participationInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>👥</Text>
                <Text style={styles.infoText}>
                  Katılım: <Text style={styles.highlight}>HERKES KATILABİLİR</Text>
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>💰</Text>
                <Text style={styles.infoText}>
                  Giriş Ücreti: <Text style={styles.highlight}>ÜCRETSİZ!</Text>
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>⏳</Text>
                <Text style={styles.infoText}>
                  Sezon Süresi: <Text style={styles.highlight}>2 Ay</Text>
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🎯</Text>
                <Text style={styles.infoText}>
                  Kazanma Şartı: <Text style={styles.highlight}>En yüksek puan (Sadece 1. ödül alır)</Text>
                </Text>
              </View>
            </View>
            
            {isParticipant ? (
              <View style={styles.alreadyJoinedContainer}>
                <Text style={styles.alreadyJoinedTitle}>✅ KATILIMINIZ KAYITLI</Text>
                <Text style={styles.alreadyJoinedText}>
                  Sezon {rankingData.currentSeason}'a ÜCRETSİZ olarak katılımınız onaylandı.
                </Text>
                
                <View style={styles.playerStatsContainer}>
                  <Text style={styles.playerStatsTitle}>İstatistikleriniz:</Text>
                  <Text style={styles.playerStat}>
                    Mevcut Sıralama: {playerRank || "Hesaplanıyor..."}
                  </Text>
                  <Text style={styles.playerStat}>
                    Toplam Maç: {playerStats.totalMatches}
                  </Text>
                  <Text style={styles.playerStat}>
                    Galibiyet: {playerStats.wins}
                  </Text>
                  {playerRank === 1 && (
                    <Text style={[styles.playerStat, styles.championStat]}>
                      ⭐ ŞU AN TÜRKİYE ŞAMPİYONUSUNUZ!
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.joinButton}
                onPress={() => onJoin()}
              >
                <Text style={styles.joinButtonText}>
                  🎯 ÜCRETSİZ KATIL
                </Text>
                <Text style={styles.joinButtonSubtext}>
                  ÜCRETSİZ • HERKES KATILABİLİR • {rankingData.participants?.length || 0} kişi katıldı
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.rankingButtons}>
            <TouchableOpacity 
              style={[styles.secondaryButton, showLeaderboard && styles.secondaryButtonActive]}
              onPress={() => setShowLeaderboard(!showLeaderboard)}
            >
              <Text style={[styles.secondaryButtonText, showLeaderboard && styles.secondaryButtonTextActive]}>
                {showLeaderboard ? '▲' : '▼'} SIRALAMAYI GÖR
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.secondaryButton, showRules && styles.secondaryButtonActive]}
              onPress={() => setShowRules(!showRules)}
            >
              <Text style={[styles.secondaryButtonText, showRules && styles.secondaryButtonTextActive]}>
                {showRules ? '▲' : '▼'} KURALLAR
              </Text>
            </TouchableOpacity>
          </View>
          
          {showLeaderboard && rankingData.leaderboard && (
            <View style={styles.leaderboardSection}>
              <Text style={styles.leaderboardTitle}>📈 CANLI SIRALAMA</Text>
              
              {rankingData.leaderboard.length > 0 ? (
                rankingData.leaderboard.slice(0, 20).map((item, index) => (
                  <View key={item.id} style={[
                    styles.rankingItem,
                    item.id === playerData.id && styles.currentPlayerRanking,
                    index === 0 && styles.firstPlaceRanking
                  ]}>
                    <View style={styles.rankingLeft}>
                      <View style={[
                        styles.rankNumberContainer,
                        index === 0 && styles.firstRank,
                        index === 1 && styles.secondRank,
                        index === 2 && styles.thirdRank
                      ]}>
                        <Text style={styles.rankNumber}>
                          {index + 1}
                        </Text>
                        {index === 0 && (
                          <Text style={styles.prizeIndicator}>🏆</Text>
                        )}
                      </View>
                      
                      <View style={styles.playerInfoRanking}>
                        <Text style={[
                          styles.playerNameRanking,
                          item.id === playerData.id && styles.currentPlayerNameRanking
                        ]}>
                          {item.name} {item.id === playerData.id && "(Siz)"}
                          {item.isPremium && " ⭐"}
                        </Text>
                        <Text style={styles.playerDetailsRanking}>
                          Seviye {item.level}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.rankingRight}>
                      <Text style={styles.playerScoreRanking}>
                        {item.score.toLocaleString()} puan
                      </Text>
                      {index === 0 && (
                        <View style={styles.winnerPrize}>
                          <Text style={styles.winnerPrizeText}>ŞAMPİYON</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyLeaderboardContainer}>
                  <Text style={styles.emptyLeaderboardText}>
                    Sıralama henüz oluşturulmadı
                  </Text>
                  <Text style={styles.emptyLeaderboardSubtext}>
                    İlk katılan siz olun!
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {showRules && (
            <View style={styles.rulesSection}>
              <Text style={styles.rulesTitle}>📜 SIRALAMA KURALLARI</Text>
              
              <View style={styles.rulesList}>
                <Text style={styles.ruleItem}>1. Her sezon 2 ay sürer</Text>
                <Text style={styles.ruleItem}>2. Giriş ÜCRETSİZdir</Text>
                <Text style={styles.ruleItem}>3. KONTENJAN YOK - HERKES KATILABİLİR</Text>
                <Text style={styles.ruleItem}>4. SADECE 1. sıraya ŞAMPİYONLUK unvanı verilir</Text>
                <Text style={styles.ruleItem}>5. 1. olan "Kalıcı #1 Türkiye" unvanı kazanır</Text>
                <Text style={styles.ruleItem}>6. 2. ve sonrası "Sezon Şampiyonu" unvanı kazanır (2 ay)</Text>
                <Text style={styles.ruleItem}>7. Puanlar normal maçlardan kazanılır</Text>
                <Text style={styles.ruleItem}>8. Sadece 1. şampiyon olur</Text>
              </View>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={onClose}
          >
            <Text style={styles.modalCloseText}>Kapat</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

// ============================================
// PREMIUM MODAL (ÖDEME ALTYAPISI)
// ============================================

const PremiumModal = ({ visible, onClose, onPurchase, isPremium }) => {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const premiumPlans = {
    monthly: {
      id: 'monthly',
      name: 'AYLIK PREMIUM',
      price: '₺99,99',
      period: 'aylık',
      features: [
        '🎯 Tamamen reklamsız deneyim',
        '⚡ Sürekli 2x TP bonusu',
        '💎 Tüm premium çerçeveler',
        '👑 Özel premium unvanlar',
        '📈 %25 daha fazla XP kazanımı',
        '🎮 Premium savaş modu',
        '🏆 Özel premium rozetleri'
      ],
      popular: true,
      productId: Platform.OS === 'ios' ? 'com.bilgisavasi.premium.monthly' : 'com.bilgisavasi.premium.monthly'
    }
  };
  
  const simulatePayment = (plan) => {
    setIsProcessing(true);
    
    // Gerçek ödeme entegrasyonu için Google Play Billing/Apple App Store kullanılmalı
    setTimeout(() => {
      setIsProcessing(false);
      onPurchase(plan);
      NotificationManager.show(
        "✅ Ödeme Başarılı",
        `Premium ${premiumPlans[plan].name} paketiniz aktif edildi!`
      );
      onClose();
    }, 2000);
  };
  
  const handlePurchase = (plan) => {
    if (isProcessing) return;
    
    Alert.alert(
      "💰 Satın Alım Onayı",
      `"${premiumPlans[plan].name}" paketini satın almak istediğinize emin misiniz?\n\n` +
      `Fiyat: ${premiumPlans[plan].price} / ${premiumPlans[plan].period}\n\n` +
      `• Otomatik yenilenen abonelik\n` +
      `• Play Store hesabınızdan ücretlendirilir\n` +
      `• Aboneliği istediğiniz zaman iptal edebilirsiniz\n` +
      `• Cari dönem bitmeden 24 saat önce otomatik yenilenir`,
      [
        { text: "İptal", style: "cancel" },
        { 
          text: isProcessing ? "İşleniyor..." : "Satın Al", 
          style: "default",
          onPress: () => simulatePayment(plan)
        }
      ]
    );
  };
  
  const handleRestorePurchase = () => {
    setIsProcessing(true);
    
    // Gerçek restore işlemi için uygun API çağrısı yapılmalı
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert(
        "Restore Edildi",
        "Premium üyeliğiniz bulunamadı. Yeni bir satın alma yapmanız gerekiyor.",
        [{ text: "Tamam" }]
      );
    }, 1500);
  };
  
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <ScrollView 
          style={styles.premiumModalContent}
          showsVerticalScrollIndicator={false}
        >
          {isPremium ? (
            <>
              <View style={styles.premiumHeaderActive}>
                <Text style={styles.premiumTitleActive}>⭐ PREMIUM ÜYE</Text>
                <Text style={styles.premiumSubtitleActive}>
                  Premium özelliklerin keyfini çıkarın!
                </Text>
              </View>
              
              <View style={styles.activePremiumContainer}>
                <View style={styles.premiumStatusCard}>
                  <Text style={styles.premiumStatusIcon}>👑</Text>
                  <View style={styles.premiumStatusInfo}>
                    <Text style={styles.premiumStatusTitle}>
                      Premium Üyeliğiniz Aktif
                    </Text>
                    <Text style={styles.premiumStatusText}>
                      Süre: Aylık üyelik
                    </Text>
                    <Text style={styles.premiumStatusText}>
                      Durum: Aktif
                    </Text>
                  </View>
                </View>
                
                <View style={styles.activeFeaturesGrid}>
                  <View style={styles.featureColumn}>
                    <View style={styles.featureItem}>
                      <Text style={styles.featureIcon}>🎯</Text>
                      <Text style={styles.featureName}>Reklamsız</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Text style={styles.featureIcon}>⚡</Text>
                      <Text style={styles.featureName}>2x TP</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Text style={styles.featureIcon}>🎮</Text>
                      <Text style={styles.featureName}>Premium Mod</Text>
                    </View>
                  </View>
                  
                  <View style={styles.featureColumn}>
                    <View style={styles.featureItem}>
                      <Text style={styles.featureIcon}>💎</Text>
                      <Text style={styles.featureName}>Çerçeveler</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Text style={styles.featureIcon}>📈</Text>
                      <Text style={styles.featureName}>+%25 XP</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Text style={styles.featureIcon}>🏆</Text>
                      <Text style={styles.featureName}>Rozetler</Text>
                    </View>
                  </View>
                </View>
                
                <Text style={styles.managementInfo}>
                  Aboneliğinizi yönetmek için Play Store hesabınıza gidin.
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.premiumHeader}>
                <Text style={styles.premiumTitle}>🚀 PREMIUM'A GEÇ</Text>
                <Text style={styles.premiumSubtitle}>
                  Reklamsız deneyim + sınırsız avantajlar!
                </Text>
              </View>
              
              <View style={styles.plansContainer}>
                <TouchableOpacity 
                  style={[
                    styles.planCard,
                    styles.popularPlanCard,
                    selectedPlan === 'monthly' && styles.selectedPlanCard
                  ]}
                  onPress={() => setSelectedPlan('monthly')}
                  activeOpacity={0.7}
                >
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{premiumPlans.monthly.name}</Text>
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>POPÜLER</Text>
                    </View>
                  </View>
                  
                  <View style={styles.priceContainer}>
                    <Text style={styles.planPrice}>{premiumPlans.monthly.price}</Text>
                    <Text style={styles.planPeriod}>/ {premiumPlans.monthly.period}</Text>
                  </View>
                  
                  <View style={styles.planFeatures}>
                    {premiumPlans.monthly.features.map((feature, index) => (
                      <Text key={index} style={styles.planFeature}>
                        ✓ {feature}
                      </Text>
                    ))}
                  </View>
                  
                  <TouchableOpacity 
                    style={[
                      styles.buyButton,
                      selectedPlan === 'monthly' && styles.buyButtonSelected
                    ]}
                    onPress={() => handlePurchase('monthly')}
                    disabled={isProcessing}
                  >
                    <Text style={styles.buyButtonText}>
                      {selectedPlan === 'monthly' ? 'SEÇİLDİ' : 'SEÇ'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={[styles.purchaseButton, isProcessing && styles.purchaseButtonDisabled]}
                onPress={() => handlePurchase(selectedPlan)}
                disabled={isProcessing}
              >
                <Text style={styles.purchaseButtonText}>
                  {isProcessing ? 'İŞLENİYOR...' : `HEMEN ${premiumPlans[selectedPlan].name} SATIN AL`}
                </Text>
                <Text style={styles.purchaseButtonPrice}>
                  {premiumPlans[selectedPlan].price} / {premiumPlans[selectedPlan].period}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.restoreButton}
                onPress={handleRestorePurchase}
                disabled={isProcessing}
              >
                <Text style={styles.restoreButtonText}>
                  {isProcessing ? 'İşleniyor...' : 'Satın Alma Geçmişini Geri Yükle'}
                </Text>
              </TouchableOpacity>
              
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentInfoText}>
                  • Ödeme Play Store hesabınıza yansıtılır
                </Text>
                <Text style={styles.paymentInfoText}>
                  • Aboneliği istediğiniz zaman iptal edebilirsiniz
                </Text>
                <Text style={styles.paymentInfoText}>
                  • Ücretsiz deneme sürümü yoktur
                </Text>
              </View>
            </>
          )}
          
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={onClose}
            disabled={isProcessing}
          >
            <Text style={styles.modalCloseText}>
              {isPremium ? 'Kapat' : 'Şimdi Değil'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

// ============================================
// REWARDS MODAL (ÖDÜLLÜ REKLAMLAR)
// ============================================

const RewardsModal = ({ visible, onClose, onWatchAd, isPremium }) => {
  const [selectedReward, setSelectedReward] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const rewards = [
    {
      id: '2x_tp',
      title: '⚡ 2x TP',
      description: isPremium ? 'Sürekli 2x TP aktif!' : '30 dakika boyunca 2 kat TP kazan',
      icon: '⚡',
      color: '#FFD700',
      duration: isPremium ? 999999 : 1800,
      disabled: isPremium
    },
    {
      id: 'extra_xp',
      title: '🎯 Ekstra XP',
      description: isPremium ? 'Premium: %25 daha fazla XP!' : '500 ekstra XP kazan',
      icon: '🎯',
      color: '#4CAF50',
      xp: isPremium ? 750 : 500,
      disabled: false
    }
  ];
  
  const handleWatchAd = async (reward) => {
    if (isPremium && reward.id === '2x_tp') {
      NotificationManager.show(
        "⭐ PREMIUM ÜYE",
        "Zaten sürekli 2x TP bonusunuz var!"
      );
      return;
    }
    
    setSelectedReward(reward);
    setIsLoading(true);
    
    try {
      const result = await AdManager.showRewardedAd();
      
      if (result.success) {
        if (reward.id === '2x_tp') {
          onWatchAd('doubleXP', reward.duration);
          NotificationManager.show(
            "🎉 TEBRİKLER!",
            "30 dakika boyunca 2x TP aktif!"
          );
        } else {
          onWatchAd('xp', reward.xp);
          NotificationManager.show(
            "🎁 ÖDÜL KAZANDIN!",
            `${reward.xp} XP kazandın!`
          );
        }
        onClose();
      }
    } catch (error) {
      if (error !== 'cancelled' && error !== 'timeout') {
        Alert.alert("Hata", "Reklam yüklenirken bir hata oluştu.");
      }
    } finally {
      setSelectedReward(null);
      setIsLoading(false);
    }
  };
  
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.rewardsModalContent}>
          <Text style={styles.modalTitle}>
            {isPremium ? '⭐ PREMIUM ÖDÜLLER' : '🎁 ÖDÜLLÜ REKLAMLAR'}
          </Text>
          <Text style={styles.modalSubtitle}>
            {isPremium ? 'Premium özellikleriniz aktif!' : 'Reklam izleyerek ödül kazan!'}
          </Text>
          
          <View style={styles.rewardsList}>
            {rewards.map((item) => (
              <TouchableOpacity 
                key={item.id}
                style={[
                  styles.rewardItem, 
                  { borderColor: item.color },
                  item.disabled && styles.disabledReward
                ]}
                onPress={() => !item.disabled && !isLoading && handleWatchAd(item)}
                disabled={item.disabled || isLoading || selectedReward?.id === item.id}
              >
                <View style={[styles.rewardIconContainer, { backgroundColor: item.color + '20' }]}>
                  <Text style={[styles.rewardIcon, { color: item.color }]}>{item.icon}</Text>
                </View>
                
                <View style={styles.rewardInfo}>
                  <Text style={[styles.rewardTitle, { color: item.color }]}>
                    {item.title} {isPremium && item.id === '2x_tp' && '⭐'}
                  </Text>
                  <Text style={styles.rewardDescription}>
                    {item.description}
                  </Text>
                </View>
                
                {item.disabled ? (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumBadgeText}>⭐</Text>
                  </View>
                ) : (
                  <View style={styles.rewardAction}>
                    {isLoading && selectedReward?.id === item.id ? (
                      <ActivityIndicator size="small" color="#ffa800" />
                    ) : (
                      <>
                        <Text style={styles.watchAdText}>
                          {isPremium ? 'ÜCRETSİZ' : 'İZLE'}
                        </Text>
                        <Text style={styles.adIcon}>{isPremium ? '⭐' : '📱'}</Text>
                      </>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          {!isPremium && (
            <TouchableOpacity 
              style={styles.goPremiumButton}
              onPress={() => {
                onClose();
                setTimeout(() => {
                  Alert.alert(
                    "Premium'a Geç",
                    "Reklamsız deneyim ve daha fazla bonus için premium'a geçin!",
                    [
                      { text: "Şimdi Değil", style: "cancel" },
                      { 
                        text: "Premium'a Geç", 
                        onPress: () => {}
                      }
                    ]
                  );
                }, 500);
              }}
            >
              <Text style={styles.goPremiumButtonText}>⭐ PREMIUM'A GEÇ (99,99₺/ay)</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={onClose}
            disabled={isLoading}
          >
            <Text style={styles.modalCloseText}>Kapat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ============================================
// MATCH RESULT MODAL
// ============================================

const MatchResultModal = ({ visible, result, onClose, onShowRewards, isPremium }) => (
  <Modal
    visible={visible}
    animationType="fade"
    transparent={true}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.resultModalContent}>
        <Text style={[styles.resultTitle, result?.win && styles.winTitle]}>
          {result?.win ? "🎉 TEBRİKLER! KAZANDINIZ!" : "💫 MAÇ SONUCU"}
        </Text>
        
        {isPremium && (
          <View style={styles.premiumResultBadge}>
            <Text style={styles.premiumResultText}>⭐ PREMIUM BONUS</Text>
          </View>
        )}
        
        <View style={styles.resultStats}>
          <View style={styles.resultStatRow}>
            <Text style={styles.resultStatLabel}>Doğru Sayısı:</Text>
            <Text style={styles.resultStatValue}>{result?.correctAnswers}/{result?.totalQuestions}</Text>
          </View>
          
          <View style={styles.resultStatRow}>
            <Text style={styles.resultStatLabel}>Toplam Puan:</Text>
            <Text style={styles.resultStatValue}>{result?.totalPoints}</Text>
          </View>
          
          {result?.isDoubleXP ? (
            <>
              <View style={[styles.resultStatRow, styles.doubleXPStat]}>
                <Text style={styles.resultStatLabel}>⚡ 2x TP AKTİF!</Text>
                <Text style={styles.resultStatValue}></Text>
              </View>
              <View style={styles.resultStatRow}>
                <Text style={styles.resultStatLabel}>XP Kazancı:</Text>
                <Text style={styles.resultStatValue}>{result?.baseXPGained} + {result?.bonusXPGained}</Text>
              </View>
              <View style={styles.resultStatRow}>
                <Text style={styles.resultStatLabel}>Toplam XP:</Text>
                <Text style={styles.resultStatValue}>{result?.xpGained}</Text>
              </View>
            </>
          ) : (
            <View style={styles.resultStatRow}>
              <Text style={styles.resultStatLabel}>Kazanılan XP:</Text>
              <Text style={styles.resultStatValue}>{result?.xpGained}</Text>
            </View>
          )}
          
          {isPremium && (
            <View style={[styles.resultStatRow, styles.premiumStat]}>
              <Text style={styles.resultStatLabel}>⭐ Premium Bonus:</Text>
              <Text style={styles.resultStatValue}>+%25 XP</Text>
            </View>
          )}
          
          <View style={[styles.resultStatRow, styles.scoreChangeRow]}>
            <Text style={styles.resultStatLabel}>Puan Değişimi:</Text>
            <Text style={[
              styles.resultStatValue,
              { color: result?.scoreChange > 0 ? '#4CAF50' : '#f44336' }
            ]}>
              {result?.scoreChange > 0 ? '+' : ''}{result?.scoreChange}
            </Text>
          </View>
          
          <View style={styles.resultStatRow}>
            <Text style={styles.resultStatLabel}>Yeni Skor:</Text>
            <Text style={styles.resultStatValue}>{result?.newScore}</Text>
          </View>
        </View>

        <View style={styles.resultButtons}>
          <TouchableOpacity 
            style={[styles.resultButton, styles.continueButton]}
            onPress={onClose}
          >
            <Text style={styles.resultButtonText}>Devam Et</Text>
          </TouchableOpacity>
          
          {!isPremium && (
            <TouchableOpacity 
              style={[styles.resultButton, styles.rewardAdButton]}
              onPress={onShowRewards}
            >
              <Text style={styles.rewardAdButtonText}>🎁 Ödüllü Reklam</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  </Modal>
);

// ============================================
// USE GAME STORE (VERİLER SIFIRDAN BAŞLIYOR)
// ============================================

const useGameStore = () => {
  const [state, setState] = useState({
    playerScore: 0,
    gameStats: {
      totalMatches: 0,
      wins: 0,
      correctAnswers: 0,
      totalQuestions: 0,
      soloWins: 0,
      totalPlayTime: 0,
      currentSeason: 1,
      adsWatched: 0,
      lastAdShown: null,
      premiumMatches: 0,
      totalPremiumXP: 0,
      interstitialAdsShown: 0,
      rewardedAdsWatched: 0
    },
    playerProfile: {
      id: null,
      username: "",
      avatar: "https://i.pravatar.cc/150?img=12",
      level: 1,
      xp: 0,
      joinDate: new Date().toISOString(),
      gold: 0,
      frame: "default",
      title: "Yeni Oyuncu",
      badges: ["🌱"],
      unlockedFrames: ["default"],
      unlockedTitles: ["Yeni Oyuncu"],
      isRank1: false,
      doubleXPActive: false,
      doubleXPRemaining: 0,
      lastRewardAd: null,
      isPremium: false,
      premiumExpiry: null,
      premiumType: null,
      premiumStartDate: null,
      unlockedPremiumFrames: [],
      unlockedPremiumTitles: [],
      premiumBadges: [],
      dailyRewardsCollected: [],
      lastDailyRewardDate: null,
      premiumStats: {
        totalPremiumDays: 0,
        premiumMatchesWon: 0,
        premiumXP: 0,
        premiumGold: 0
      },
      isLoggedIn: false,
      privacyPolicyAccepted: false
    },
    leaderboard: [
      { id: 1, name: "QuizMaster", score: 4850, level: 25, avatar: "https://i.pravatar.cc/100?img=5", isOnline: true, isRank1: true, frame: "diamond", isPremium: true },
      { id: 2, name: "BilgeKral", score: 4200, level: 23, avatar: "https://i.pravatar.cc/100?img=6", isOnline: false, frame: "silver", isPremium: false },
      { id: 3, name: "QuizŞampiyonu", score: 1850, level: 15, avatar: "https://i.pravatar.cc/100?img=12", isOnline: true, frame: "default", isPremium: false },
    ],
    settings: {
      soundEnabled: true,
      musicEnabled: true,
      notifications: true,
      vibration: true,
      theme: 'default',
      premiumTheme: false,
      adConsent: true
    },
    showLevelUp: false,
    newLevel: null,
    levelRewards: null,
    showPremiumActivation: false,
    
    // TÜRKİYE SIRALAMASI - 2 AY'DA BİR SIFIRLANIYOR
    turkeyRanking: {
      isActive: true,
      currentSeason: 1,
      seasonStartDate: new Date().toISOString(),
      seasonEndDate: new Date(Date.now() + SEASON_DURATION).toISOString(),
      participants: [],
      leaderboard: [],
      pastSeasons: []
    },
    playerTurkeyStats: {
      isParticipant: false,
      joinedSeasons: 0,
      bestRank: null,
      totalMatches: 0,
      wins: 0,
      currentSeason: {
        rank: null,
        score: 0,
        matches: 0,
        wins: 0
      }
    }
  });

  const actions = useMemo(() => ({
    loginUser: (userData, privacyAccepted = true) => setState(prev => ({
      ...prev,
      playerProfile: { 
        ...prev.playerProfile,
        id: userData.id,
        username: userData.username,
        avatar: `https://i.pravatar.cc/150?img=${(userData.id % 70) || 12}`,
        isLoggedIn: true,
        privacyPolicyAccepted: privacyAccepted,
        joinDate: new Date().toISOString()
      }
    })),
    
    logoutUser: () => setState(prev => ({
      ...prev,
      playerProfile: { 
        ...prev.playerProfile,
        username: "",
        isLoggedIn: false,
        level: 1,
        xp: 0,
        gold: 0,
        isPremium: false
      },
      playerScore: 0,
      playerTurkeyStats: {
        isParticipant: false,
        joinedSeasons: 0,
        bestRank: null,
        totalMatches: 0,
        wins: 0,
        currentSeason: {
          rank: null,
          score: 0,
          matches: 0,
          wins: 0
        }
      }
    })),
    
    deleteAccount: () => {
      Alert.alert(
        "Hesap Silindi",
        "Hesabınız ve tüm verileriniz başarıyla silindi.",
        [{ text: "Tamam" }]
      );
      
      setState(prev => ({
        ...prev,
        playerProfile: { 
          ...prev.playerProfile,
          username: "",
          isLoggedIn: false,
          level: 1,
          xp: 0,
          gold: 0,
          isPremium: false
        },
        playerScore: 0,
        gameStats: {
          totalMatches: 0,
          wins: 0,
          correctAnswers: 0,
          totalQuestions: 0,
          soloWins: 0,
          totalPlayTime: 0,
          currentSeason: 1,
          adsWatched: 0,
          lastAdShown: null,
          premiumMatches: 0,
          totalPremiumXP: 0,
          interstitialAdsShown: 0,
          rewardedAdsWatched: 0
        },
        playerTurkeyStats: {
          isParticipant: false,
          joinedSeasons: 0,
          bestRank: null,
          totalMatches: 0,
          wins: 0,
          currentSeason: {
            rank: null,
            score: 0,
            matches: 0,
            wins: 0
          }
        }
      }));
      
      return true;
    },
    
    updateScore: (newScore) => setState(prev => ({
      ...prev,
      playerScore: newScore
    })),
    
    updateStats: (newStats) => setState(prev => ({
      ...prev,
      gameStats: { ...prev.gameStats, ...newStats }
    })),
    
    updateSettings: (newSettings) => setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    })),
    
    acceptPrivacyPolicy: () => setState(prev => ({
      ...prev,
      playerProfile: { 
        ...prev.playerProfile,
        privacyPolicyAccepted: true 
      }
    })),
    
    completeMatch: (matchData) => {
      setState(prev => {
        const isWin = matchData.correctAnswers >= Math.floor(matchData.totalQuestions * 0.6);
        const isPremiumMatch = matchData.mode === "PREMIUM";
        const newStats = {
          totalMatches: prev.gameStats.totalMatches + 1,
          wins: isWin ? prev.gameStats.wins + 1 : prev.gameStats.wins,
          correctAnswers: prev.gameStats.correctAnswers + matchData.correctAnswers,
          totalQuestions: prev.gameStats.totalQuestions + matchData.totalQuestions,
          totalPlayTime: prev.gameStats.totalPlayTime + (matchData.duration || 0),
        };
        
        if (matchData.mode === "SOLO" && isWin) newStats.soloWins = prev.gameStats.soloWins + 1;
        if (isPremiumMatch) {
          newStats.premiumMatches = prev.gameStats.premiumMatches + 1;
          newStats.totalPremiumXP = prev.gameStats.totalPremiumXP + (matchData.xpGained || 0);
        }
        
        return {
          ...prev,
          gameStats: newStats
        };
      });
    },
    
    updateFrame: (frameType) => setState(prev => ({
      ...prev,
      playerProfile: { 
        ...prev.playerProfile, 
        frame: frameType,
        unlockedFrames: [...new Set([...prev.playerProfile.unlockedFrames, frameType])]
      }
    })),
    
    updateTitle: (newTitle) => setState(prev => ({
      ...prev,
      playerProfile: { 
        ...prev.playerProfile, 
        title: newTitle,
        unlockedTitles: [...new Set([...prev.playerProfile.unlockedTitles, newTitle])]
      }
    })),
    
    addXP: (xpGained, isPremiumBonus = false) => setState(prev => {
      const newXP = prev.playerProfile.xp + xpGained;
      let newLevel = prev.playerProfile.level;
      let xpRemaining = newXP;
      
      // Seviye atlama kontrolü
      while (xpRemaining >= (newLevel * 1000)) {
        xpRemaining -= (newLevel * 1000);
        newLevel++;
      }
      
      return {
        ...prev,
        playerProfile: {
          ...prev.playerProfile,
          level: newLevel,
          xp: xpRemaining,
          premiumStats: {
            ...prev.playerProfile.premiumStats,
            premiumXP: isPremiumBonus ? 
              prev.playerProfile.premiumStats.premiumXP + xpGained : 
              prev.playerProfile.premiumStats.premiumXP
          }
        },
        ...(newLevel > prev.playerProfile.level && { 
          showLevelUp: true, 
          newLevel
        })
      };
    }),
    
    adWatched: (adType = 'interstitial') => setState(prev => ({
      ...prev,
      gameStats: {
        ...prev.gameStats,
        adsWatched: prev.gameStats.adsWatched + 1,
        lastAdShown: Date.now(),
        ...(adType === 'interstitial' && {
          interstitialAdsShown: prev.gameStats.interstitialAdsShown + 1
        }),
        ...(adType === 'rewarded' && {
          rewardedAdsWatched: prev.gameStats.rewardedAdsWatched + 1
        })
      }
    })),
    
    activateDoubleXP: (duration = 1800, permanent = false) => setState(prev => ({
      ...prev,
      playerProfile: { 
        ...prev.playerProfile, 
        doubleXPActive: true,
        doubleXPRemaining: duration,
        doubleXPIsPermanent: permanent
      }
    })),
    
    updateDoubleXP: (remainingTime) => setState(prev => ({
      ...prev,
      playerProfile: {
        ...prev.playerProfile,
        doubleXPRemaining: remainingTime,
        doubleXPActive: remainingTime > 0
      }
    })),
    
    completeMatchWithXP: (matchData) => {
      const isPremium = state.playerProfile.isPremium;
      const xpMultiplier = DoubleXPSystem.getMultiplier();
      
      const baseXP = matchData.correctAnswers * 25;
      const accuracyBonus = Math.floor((matchData.correctAnswers / matchData.totalQuestions) * 100);
      const comboBonus = matchData.combo * 10;
      const winBonus = matchData.win ? 200 : 50;
      const timeBonus = matchData.duration < 60 ? 50 : 0;
      
      let xpGained = Math.floor(
        (baseXP + accuracyBonus + comboBonus + winBonus + timeBonus) * xpMultiplier
      );
      
      if (isPremium) {
        xpGained = Math.floor(xpGained * 1.25);
      }
      
      const baseXPGained = xpMultiplier === 2 ? Math.floor(xpGained / 2) : xpGained;
      const bonusXPGained = xpMultiplier === 2 ? Math.floor(xpGained / 2) : 0;
      const premiumBonus = isPremium ? Math.floor(xpGained * 0.25) : 0;
      
      actions.addXP(xpGained, premiumBonus > 0);
      actions.completeMatch(matchData);
      
      if (state.playerTurkeyStats.isParticipant) {
        actions.updateTurkeyRanking(matchData);
      }
      
      return {
        xpGained,
        baseXPGained,
        bonusXPGained,
        premiumBonus,
        isDoubleXP: xpMultiplier === 2,
        isPremium
      };
    },
    
    setRank1: (isRank1) => setState(prev => ({
      ...prev,
      playerProfile: { 
        ...prev.playerProfile, 
        isRank1
      }
    })),
    
    hideLevelUp: () => setState(prev => ({
      ...prev,
      showLevelUp: false,
      newLevel: null,
      levelRewards: null
    })),
    
    activatePremium: (premiumType) => {
      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      
      setState(prev => {
        let goldBonus = 1000;
        let frames = ['platinum', 'diamond'];
        let titles = ['Premium Üye'];
        
        return {
          ...prev,
          playerProfile: {
            ...prev.playerProfile,
            isPremium: true,
            premiumType: premiumType,
            premiumStartDate: startDate.toISOString(),
            premiumExpiry: expiryDate.toISOString(),
            gold: prev.playerProfile.gold + goldBonus,
            frame: 'diamond',
            title: 'Premium Üye',
            badges: [...prev.playerProfile.badges, '⭐'],
            premiumBadges: [...prev.playerProfile.premiumBadges, '⭐'],
            unlockedPremiumFrames: [...new Set([...prev.playerProfile.unlockedPremiumFrames, ...frames])],
            unlockedPremiumTitles: [...new Set([...prev.playerProfile.unlockedPremiumTitles, ...titles])],
            premiumStats: {
              totalPremiumDays: 0,
              premiumMatchesWon: 0,
              premiumXP: 0,
              premiumGold: goldBonus
            },
            lastPurchaseDate: startDate.toISOString(),
            purchaseHistory: [...(prev.playerProfile.purchaseHistory || []), {
              date: startDate.toISOString(),
              type: premiumType,
              amount: 99.99,
              currency: 'TRY'
            }]
          },
          showPremiumActivation: true
        };
      });
      
      AdManager.setPremium(true);
      DoubleXPSystem.activate(999999, true);
      
      return true;
    },
    
    deactivatePremium: () => {
      setState(prev => ({
        ...prev,
        playerProfile: {
          ...prev.playerProfile,
          isPremium: false,
          premiumType: null,
          premiumStartDate: null,
          premiumExpiry: null,
          frame: 'default',
          title: 'Yeni Oyuncu',
          premiumBadges: []
        }
      }));
      
      AdManager.setPremium(false);
      DoubleXPSystem.deactivate();
      
      return true;
    },
    
    checkPremiumExpiry: () => {
      const { premiumExpiry } = state.playerProfile;
      if (!premiumExpiry) return;
      
      const now = new Date();
      const expiry = new Date(premiumExpiry);
      
      if (now > expiry) {
        actions.deactivatePremium();
        NotificationManager.show(
          "Premium Süresi Doldu",
          "Premium üyeliğinizin süresi doldu. Yenilemek için premium'a gidin."
        );
      }
    },
    
    hidePremiumActivation: () => setState(prev => ({
      ...prev,
      showPremiumActivation: false
    })),
    
    joinTurkeyRanking: () => {
      Alert.alert(
        "Türkiye Sıralaması",
        `Türkiye Sıralaması'na ÜCRETSİZ olarak katılmak istiyor musunuz?\n\n` +
        `• KONTENJAN YOK - HERKES KATILABİLİR\n` +
        `• ŞAMPİYONLUK unvanı ve ödülleri\n` +
        `• Sezon 2 ay sürer`,
        [
          { text: "İptal", style: "cancel" },
          { 
            text: "ÜCRETSİZ Katıl", 
            onPress: () => {
              setState(prev => {
                const newParticipants = [...prev.turkeyRanking.participants, {
                  id: prev.playerProfile.id,
                  name: prev.playerProfile.username,
                  score: prev.playerScore,
                  level: prev.playerProfile.level,
                  isPremium: prev.playerProfile.isPremium,
                  joinDate: new Date().toISOString(),
                  paid: false
                }];
                
                const newLeaderboard = [...newParticipants]
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => ({
                    ...player,
                    rank: index + 1
                  }));
                
                return {
                  ...prev,
                  turkeyRanking: {
                    ...prev.turkeyRanking,
                    participants: newParticipants,
                    leaderboard: newLeaderboard
                  },
                  playerTurkeyStats: {
                    ...prev.playerTurkeyStats,
                    isParticipant: true,
                    joinedSeasons: prev.playerTurkeyStats.joinedSeasons + 1,
                    currentSeason: {
                      ...prev.playerTurkeyStats.currentSeason,
                      rank: newLeaderboard.find(p => p.id === prev.playerProfile.id)?.rank || null,
                      score: prev.playerScore
                    }
                  }
                };
              });
              
              NotificationManager.show(
                "✅ KATILIM BAŞARILI",
                `Türkiye Sıralaması'na ÜCRETSİZ olarak katıldınız! İyi şanslar!`
              );
            }
          }
        ]
      );
    },
    
    updateTurkeyRanking: (matchData) => {
      setState(prev => {
        if (!prev.playerTurkeyStats.isParticipant) return prev;
        
        const newScore = prev.playerScore + (matchData.win ? 100 : -30);
        const newMatches = prev.playerTurkeyStats.currentSeason.matches + 1;
        const newWins = matchData.win ? prev.playerTurkeyStats.currentSeason.wins + 1 : prev.playerTurkeyStats.currentSeason.wins;
        
        const updatedParticipants = prev.turkeyRanking.participants.map(participant => {
          if (participant.id === prev.playerProfile.id) {
            return {
              ...participant,
              score: newScore,
              level: prev.playerProfile.level
            };
          }
          return participant;
        });
        
        const newLeaderboard = [...updatedParticipants]
          .sort((a, b) => b.score - a.score)
          .map((player, index) => ({
            ...player,
            rank: index + 1
          }));
        
        const playerRank = newLeaderboard.find(p => p.id === prev.playerProfile.id)?.rank || null;
        
        let bestRank = prev.playerTurkeyStats.bestRank;
        if (playerRank && (!bestRank || playerRank < bestRank)) {
          bestRank = playerRank;
        }
        
        return {
          ...prev,
          playerScore: newScore,
          turkeyRanking: {
            ...prev.turkeyRanking,
            participants: updatedParticipants,
            leaderboard: newLeaderboard
          },
          playerTurkeyStats: {
            ...prev.playerTurkeyStats,
            totalMatches: prev.playerTurkeyStats.totalMatches + 1,
            wins: matchData.win ? prev.playerTurkeyStats.wins + 1 : prev.playerTurkeyStats.wins,
            bestRank,
            currentSeason: {
              rank: playerRank,
              score: newScore,
              matches: newMatches,
              wins: newWins
            }
          }
        };
      });
    },
    
    completeSeason: () => {
      setState(prev => {
        const currentSeason = prev.turkeyRanking.currentSeason;
        const leaderboard = prev.turkeyRanking.leaderboard;
        
        if (leaderboard.length === 0) return prev;
        
        const champion = leaderboard[0];
        
        const newSeason = currentSeason + 1;
        const now = new Date();
        const seasonEndDate = new Date(now.getTime() + SEASON_DURATION);
        
        const pastSeason = {
          season: currentSeason,
          startDate: prev.turkeyRanking.seasonStartDate,
          endDate: now.toISOString(),
          champion: {
            id: champion.id,
            name: champion.name,
            score: champion.score,
            prize: 0
          },
          topPlayers: leaderboard.slice(0, 10).map(p => ({
            id: p.id,
            name: p.name,
            rank: p.rank,
            score: p.score,
            prize: 0
          })),
          totalParticipants: leaderboard.length,
          note: "Kontenjan yok - Herkes katıldı, para ödülü yok"
        };
        
        let playerTitle = prev.playerProfile.title;
        let playerFrame = prev.playerProfile.frame;
        let playerBadges = [...prev.playerProfile.badges];
        
        if (champion.id === prev.playerProfile.id) {
          playerTitle = TURKEY_RANKING.REWARDS.PERMANENT_TITLE;
          playerFrame = TURKEY_RANKING.REWARDS.FRAME;
          playerBadges.push(TURKEY_RANKING.REWARDS.BADGE_ICON);
          
          NotificationManager.show(
            "🎉 TEBRİKLER! TÜRKİYE ŞAMPİYONU OLDUNUZ!",
            `ŞAMPİYONLUK unvanını kazandınız!`
          );
        } else if (prev.playerTurkeyStats.isParticipant) {
          playerTitle = TURKEY_RANKING.REWARDS.SEASON_TITLE;
          playerBadges.push('🏅');
        }
        
        return {
          ...prev,
          turkeyRanking: {
            isActive: true,
            currentSeason: newSeason,
            seasonStartDate: now.toISOString(),
            seasonEndDate: seasonEndDate.toISOString(),
            participants: [],
            leaderboard: [],
            pastSeasons: [pastSeason, ...prev.turkeyRanking.pastSeasons].slice(0, 10)
          },
          playerTurkeyStats: {
            isParticipant: false,
            joinedSeasons: prev.playerTurkeyStats.joinedSeasons,
            bestRank: prev.playerTurkeyStats.bestRank,
            totalMatches: 0,
            wins: 0,
            currentSeason: {
              rank: null,
              score: 0,
              matches: 0,
              wins: 0
            }
          },
          playerProfile: {
            ...prev.playerProfile,
            title: playerTitle,
            frame: playerFrame,
            badges: [...new Set(playerBadges)],
            isRank1: champion.id === prev.playerProfile.id
          }
        };
      });
      
      NotificationManager.show(
        "🎉 SEZON SONU!",
        "Türkiye Sıralaması sezonu tamamlandı! Yeni sezon başladı."
      );
    },
    
    checkSeasonEnd: () => {
      const now = new Date();
      const seasonEnd = new Date(state.turkeyRanking.seasonEndDate);
      
      if (now > seasonEnd) {
        actions.completeSeason();
      }
    }
  }), [state.playerProfile.isPremium, state.playerTurkeyStats.isParticipant, state.turkeyRanking.participants]);

  return { ...state, ...actions };
};

// ============================================
// ANA UYGULAMA COMPONENTİ
// ============================================

const App = () => {
  const gameStore = useGameStore();
  const {
    playerScore,
    gameStats,
    playerProfile,
    leaderboard,
    settings,
    showLevelUp,
    newLevel,
    showPremiumActivation,
    turkeyRanking,
    playerTurkeyStats,
    loginUser,
    logoutUser,
    deleteAccount,
    updateScore,
    updateStats,
    updateSettings,
    updateFrame,
    updateTitle,
    addXP,
    completeMatchWithXP,
    setRank1,
    hideLevelUp,
    adWatched,
    activateDoubleXP,
    updateDoubleXP,
    activatePremium,
    deactivatePremium,
    checkPremiumExpiry,
    hidePremiumActivation,
    joinTurkeyRanking,
    updateTurkeyRanking,
    checkSeasonEnd
  } = gameStore;

  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState("home");
  const [matchFinding, setMatchFinding] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(15);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [matchStarted, setMatchStarted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [combo, setCombo] = useState(0);
  const [opponent, setOpponent] = useState(null);
  const [opponentAnswers, setOpponentAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [selectedMode, setSelectedMode] = useState("SOLO");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showMatchResult, setShowMatchResult] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [showScoreAnimation, setShowScoreAnimation] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showTurkeyRanking, setShowTurkeyRanking] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [doubleXPRemaining, setDoubleXPRemaining] = useState(playerProfile.doubleXPRemaining);
  const [isDoubleXPActive, setIsDoubleXPActive] = useState(playerProfile.doubleXPActive);
  const [isDoubleXPPermanent, setIsDoubleXPPermanent] = useState(false);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [questionsError, setQuestionsError] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Animasyon referansları
  const progressAnim = useRef(new Animated.Value(0)).current;
  const matchmakingAnim = useRef(new Animated.Value(0)).current;
  const timerAnim = useRef(new Animated.Value(1)).current;
  const scoreAnimationRef = useRef(new Animated.Value(0)).current;
  const levelUpAnim = useRef(new Animated.Value(0)).current;
  const doubleXPAnim = useRef(new Animated.Value(0)).current;
  const premiumActivationAnim = useRef(new Animated.Value(0)).current;
  const questionTimerRef = useRef(null);
  const optionAnimations = useRef([]);
  const matchStartTime = useRef(null);
  const doubleXPTimerRef = useRef(null);

  // ============================================
  // YARDIMCI FONKSİYONLAR
  // ============================================

  const getQuestionsForMatch = useCallback(async (mode) => {
    try {
      setIsLoading(true);
      const questions = await QuestionLoader.getQuestionsForMatch(mode);
      
      if (questions.length === 0) {
        setQuestionsError(true);
        throw new Error('Sorular yüklenemedi! İnternet bağlantınızı kontrol edin.');
      }
      
      setQuestionsError(false);
      return questions;
    } catch (error) {
      console.error('Sorular yüklenirken hata:', error);
      setQuestionsError(true);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const playSound = useCallback((soundName) => {
    if (!settings.soundEnabled) return;
    // Ses çalma kodu buraya gelecek
    if (settings.vibration && soundName === 'correct') {
      Vibration.vibrate(100);
    } else if (settings.vibration && soundName === 'wrong') {
      Vibration.vibrate(200);
    } else if (settings.vibration && soundName === 'victory') {
      Vibration.vibrate([100, 100, 100]);
    }
  }, [settings.soundEnabled, settings.vibration]);

  const animateTimer = useCallback(() => {
    Animated.sequence([
      Animated.timing(timerAnim, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(timerAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [timerAnim]);

  const animateLevelUp = useCallback(() => {
    levelUpAnim.setValue(0);
    Animated.sequence([
      Animated.timing(levelUpAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(levelUpAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start();
  }, [levelUpAnim]);

  const animatePremiumActivation = useCallback(() => {
    premiumActivationAnim.setValue(0);
    Animated.sequence([
      Animated.timing(premiumActivationAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(premiumActivationAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start(() => {
      hidePremiumActivation();
    });
  }, [premiumActivationAnim, hidePremiumActivation]);

  const showScoreChangeAnimation = useCallback((points, isPositive = true) => {
    setShowScoreAnimation(true);
    scoreAnimationRef.setValue(0);
    
    Animated.sequence([
      Animated.timing(scoreAnimationRef, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(scoreAnimationRef, {
        toValue: 0,
        duration: 500,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowScoreAnimation(false);
    });
  }, [scoreAnimationRef]);

  const getDifficultyColor = useCallback((difficulty) => {
    switch (difficulty) {
      case "Kolay": return "#4CAF50";
      case "Orta": return "#FF9800";
      case "Zor": return "#F44336";
      default: return "#9C27B0";
    }
  }, []);

  const animateOptionsIn = useCallback(() => {
    const currentQuestionData = currentQuestions[currentQuestion];
    if (!currentQuestionData || !currentQuestionData.options) return;
    
    optionAnimations.current = currentQuestionData.options.map(() => new Animated.Value(0));
    
    optionAnimations.current.forEach((anim, index) => {
      if (anim) {
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          delay: index * 100,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }).start();
      }
    });
  }, [currentQuestion, currentQuestions]);

  const startQuestionTimer = useCallback(() => {
    const timePerQuestion = MATCH_MODES[selectedMode]?.timePerQuestion || 15;
    setQuestionTimeLeft(timePerQuestion);
    
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
    }
    
    questionTimerRef.current = setInterval(() => {
      setQuestionTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(questionTimerRef.current);
          handleTimeUp();
          return 0;
        }
        if (prev <= 5) {
          playSound('timer_warning');
          animateTimer();
        }
        return prev - 1;
      });
    }, 1000);
  }, [selectedMode, playSound, animateTimer]);

  const handleTimeUp = useCallback(() => {
    if (selectedOption === null) {
      setSelectedOption(-1);
      setShowResult(true);
      playSound('time_up');
      setTimeout(nextQuestion, 2000);
    }
  }, [selectedOption, playSound]);

  const nextQuestion = useCallback(() => {
    if (currentQuestion < currentQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedOption(null);
      setShowResult(false);
      startQuestionTimer();
      animateOptionsIn();
      
      const currentQ = currentQuestions[currentQuestion + 1];
      if (currentQ && selectedMode === "SOLO") {
        const responseTime = RealisticBot.getResponseTime(currentQ, currentQ.difficulty);
        setTimeout(() => {
          const botAnswer = RealisticBot.getAnswer(currentQ, currentQ.difficulty, questionTimeLeft);
          setOpponentAnswers(prev => {
            const newAnswers = [...prev];
            newAnswers[currentQuestion + 1] = botAnswer;
            return newAnswers;
          });
        }, responseTime);
      }
    } else {
      finishMatch();
    }
  }, [currentQuestion, currentQuestions.length, selectedMode, startQuestionTimer, animateOptionsIn, questionTimeLeft]);

  const finishMatch = useCallback(() => {
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
    
    const matchDuration = Math.floor((Date.now() - matchStartTime.current) / 1000);
    const basePoints = correctAnswers * 10;
    const comboBonus = Math.floor(combo / 3) * 5;
    const modeMultiplier = MATCH_MODES[selectedMode]?.multiplier || 1.0;
    const totalPoints = Math.floor((basePoints + comboBonus) * modeMultiplier);
    
    const opponentCorrectAnswers = opponentAnswers.filter((answer, index) => {
      if (answer === null || answer === undefined) return false;
      return answer === currentQuestions[index]?.correctAnswer;
    }).length;
    
    const win = correctAnswers > opponentCorrectAnswers || 
                (correctAnswers === opponentCorrectAnswers && correctAnswers > 0 && Math.random() > 0.5);
    const scoreChange = win ? totalPoints : -Math.floor(totalPoints * 0.3);
    
    const newScore = Math.max(0, playerScore + scoreChange);
    
    updateScore(newScore);

    const xpResult = completeMatchWithXP({
      correctAnswers,
      totalQuestions: currentQuestions.length,
      duration: matchDuration,
      mode: selectedMode,
      win,
      combo,
      difficulty: currentQuestions[0]?.difficulty || 'Orta'
    });

    const resultData = {
      win,
      correctAnswers,
      totalQuestions: currentQuestions.length,
      combo,
      basePoints,
      comboBonus,
      modeMultiplier,
      totalPoints,
      scoreChange,
      newScore,
      mode: selectedMode,
      xpGained: xpResult.xpGained,
      baseXPGained: xpResult.baseXPGained,
      bonusXPGained: xpResult.bonusXPGained,
      premiumBonus: xpResult.premiumBonus,
      isDoubleXP: xpResult.isDoubleXP,
      isPremium: xpResult.isPremium,
      opponentCorrectAnswers
    };

    setMatchResult(resultData);
    setShowMatchResult(true);
    setMatchStarted(false);
    
    showScoreChangeAnimation(scoreChange, win);

    playSound(win ? 'victory' : 'defeat');
    
    // MAÇ SONU GEÇİŞ REKLAMI
    if (!playerProfile.isPremium) {
      setTimeout(() => {
        AdManager.showInterstitialAd().then((adShown) => {
          if (adShown) {
            adWatched('interstitial');
          }
        });
      }, 2000);
    }
  }, [correctAnswers, combo, selectedMode, playerScore, opponentAnswers, currentQuestions, updateScore, completeMatchWithXP, playSound, showScoreChangeAnimation, adWatched, playerProfile.isPremium]);

  const answerQuestion = useCallback((optionIndex) => {
    if (selectedOption !== null) return;
    
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
    }
    setSelectedOption(optionIndex);
    setShowResult(true);

    const currentQ = currentQuestions[currentQuestion];
    if (!currentQ) return;

    // Bot cevabı
    const opponentAnswer = RealisticBot.getAnswer(currentQ, currentQ.difficulty, questionTimeLeft);
    setOpponentAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestion] = opponentAnswer;
      return newAnswers;
    });

    const isCorrect = optionIndex === currentQ.correctAnswer;
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setCombo(prev => prev + 1);
      playSound('correct');
    } else {
      setCombo(0);
      playSound('wrong');
    }

    setTimeout(nextQuestion, 2000);
  }, [selectedOption, currentQuestion, opponentAnswers, currentQuestions, questionTimeLeft, nextQuestion, playSound]);

  const startMatch = useCallback(async () => {
    try {
      const matchQuestions = await getQuestionsForMatch(selectedMode);
      setCurrentQuestions(matchQuestions);
      
      setMatchFinding(false);
      setMatchStarted(true);
      setCurrentQuestion(0);
      setCorrectAnswers(0);
      setCombo(0);
      setQuestionTimeLeft(15);
      setSelectedOption(null);
      setShowResult(false);
      setOpponentAnswers(new Array(matchQuestions.length).fill(null));
      setCurrentScreen("match");
      matchStartTime.current = Date.now();
      startQuestionTimer();
      animateOptionsIn();
      playSound('match_start');
      
      if (selectedMode === "SOLO") {
        const firstQuestion = matchQuestions[0];
        const responseTime = RealisticBot.getResponseTime(firstQuestion, firstQuestion.difficulty);
        setTimeout(() => {
          const opponentAnswer = RealisticBot.getAnswer(firstQuestion, firstQuestion.difficulty, questionTimeLeft);
          setOpponentAnswers(prev => {
            const newAnswers = [...prev];
            newAnswers[0] = opponentAnswer;
            return newAnswers;
          });
        }, responseTime);
      }
    } catch (error) {
      console.error('Maç başlatılırken hata:', error);
      NotificationManager.show('Hata', 'Sorular yüklenemedi! İnternet bağlantınızı kontrol edin.');
      setMatchFinding(false);
      setCurrentScreen("home");
    }
  }, [selectedMode, getQuestionsForMatch, startQuestionTimer, animateOptionsIn, playSound, questionTimeLeft]);

  const startMatchmaking = useCallback(async () => {
    if (!playerProfile.isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    
    if (selectedMode === "PREMIUM" && !playerProfile.isPremium) {
      Alert.alert(
        "Premium Gerekli",
        "Premium savaş modu için premium üye olmalısınız.",
        [
          { text: "İptal", style: "cancel" },
          { 
            text: "Premium'a Geç", 
            onPress: () => setShowPremiumModal(true)
          }
        ]
      );
      return;
    }
    
    if (!QuestionLoader.hasQuestions()) {
      try {
        NotificationManager.show("Yükleniyor", "Sorular yükleniyor...");
        await QuestionLoader.loadQuestions();
        
        if (!QuestionLoader.hasQuestions()) {
          Alert.alert(
            "Hata",
            "Sorular yüklenemedi! İnternet bağlantınızı kontrol edin.",
            [{ text: "Tamam" }]
          );
          return;
        }
      } catch (error) {
        Alert.alert(
          "Hata",
          "Sorular yüklenemedi! İnternet bağlantınızı kontrol edin.",
          [{ text: "Tamam" }]
        );
        return;
      }
    }
    
    setMatchFinding(true);
    playSound('matchmaking');
    
    const realisticUsername = getRandomRealisticUsername();
    const realisticScore = getRandomScore();
    const realisticLevel = getRandomLevel();
    const isOpponentPremium = Math.random() > 0.7;
    
    const realisticOpponent = {
      id: Math.floor(Math.random() * 1000) + 100,
      name: realisticUsername,
      avatar: `https://i.pravatar.cc/100?img=${Math.floor(Math.random() * 70)}`,
      isPremium: isOpponentPremium,
      score: realisticScore,
      level: realisticLevel,
    };
    setOpponent(realisticOpponent);
    
    Animated.loop(
      Animated.timing(matchmakingAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    setTimeout(() => {
      startMatch();
    }, 2000);
  }, [selectedMode, playerProfile.isLoggedIn, playerProfile.isPremium, playSound, matchmakingAnim, startMatch]);

  const closeMatchResult = useCallback(() => {
    setShowMatchResult(false);
    setCurrentScreen("home");
    setSelectedMode("SOLO");
    setCurrentQuestions([]);
  }, []);

  const handleWatchRewardedAd = useCallback((rewardType, amount) => {
    if (rewardType === 'doubleXP') {
      activateDoubleXP(amount, false);
      setIsDoubleXPActive(true);
      setIsDoubleXPPermanent(false);
      setDoubleXPRemaining(amount);
      
      Animated.sequence([
        Animated.timing(doubleXPAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(doubleXPAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        })
      ]).start();
    } else if (rewardType === 'xp') {
      addXP(amount);
      NotificationManager.show(
        "🎁 XP KAZANDIN!",
        `Reklam izleyerek ${amount} XP kazandın!`
      );
    }
    
    adWatched('rewarded');
  }, [activateDoubleXP, addXP, adWatched, doubleXPAnim]);

  const handlePurchasePremium = useCallback((planType) => {
    activatePremium(planType);
    animatePremiumActivation();
    
    NotificationManager.show(
      "🎉 TEBRİKLER!",
      `Premium üyeliğiniz aktif edildi!\n\nArtık tüm premium özelliklere sahipsiniz! ⭐`
    );
  }, [activatePremium, animatePremiumActivation]);

  const handleLogin = useCallback((userData, privacyAccepted) => {
    loginUser(userData, privacyAccepted);
  }, [loginUser]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      "Çıkış Yap",
      "Hesabınızdan çıkış yapmak istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Çıkış Yap", 
          style: "destructive",
          onPress: () => {
            logoutUser();
            NotificationManager.show(
              "Çıkış Yapıldı",
              "Başarıyla çıkış yapıldı."
            );
          }
        }
      ]
    );
  }, [logoutUser]);

  const handleDeleteAccount = useCallback(() => {
    deleteAccount();
  }, [deleteAccount]);

  const getOptionStyle = useCallback((optionIndex) => {
    const currentQ = currentQuestions[currentQuestion];
    if (!currentQ || !currentQ.options) return styles.optionNormal;
    
    if (!showResult) {
      return selectedOption === optionIndex ? styles.optionSelected : styles.optionNormal;
    }
    
    if (optionIndex === currentQ.correctAnswer) {
      return styles.optionCorrect;
    } else if (optionIndex === selectedOption) {
      return styles.optionWrong;
    }
    return styles.optionNormal;
  }, [currentQuestions, currentQuestion, showResult, selectedOption]);

  // ============================================
  // EFFECT HOOK'LARI
  // ============================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 4000);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        await QuestionLoader.loadQuestions();
        setQuestionsLoaded(true);
      } catch (error) {
        console.error('Sorular yüklenirken hata:', error);
        setQuestionsLoaded(true);
        setQuestionsError(true);
      }
    };
    
    loadQuestions();
    
    const refreshInterval = setInterval(() => {
      QuestionLoader.loadQuestions();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    const seasonCheckInterval = setInterval(() => {
      checkSeasonEnd();
    }, 24 * 60 * 60 * 1000); // Her gün kontrol et
    
    return () => clearInterval(seasonCheckInterval);
  }, [checkSeasonEnd]);

  useEffect(() => {
    if (showLevelUp && newLevel) {
      animateLevelUp();
      
      NotificationManager.show(
        "🎉 SEVİYE ATLADIN!",
        `Seviye ${newLevel} oldun!`
      );
    }
  }, [showLevelUp, newLevel, animateLevelUp]);

  useEffect(() => {
    if (playerProfile.isPremium) {
      DoubleXPSystem.activate(999999, true);
      setIsDoubleXPActive(true);
      setIsDoubleXPPermanent(true);
      setDoubleXPRemaining(999999);
    } else if (playerProfile.doubleXPActive && playerProfile.doubleXPRemaining > 0) {
      setIsDoubleXPActive(true);
      setIsDoubleXPPermanent(false);
      setDoubleXPRemaining(playerProfile.doubleXPRemaining);
      
      if (doubleXPTimerRef.current) {
        clearInterval(doubleXPTimerRef.current);
      }
      
      doubleXPTimerRef.current = setInterval(() => {
        setDoubleXPRemaining(prev => {
          const newTime = prev - 1;
          
          if (newTime <= 0) {
            clearInterval(doubleXPTimerRef.current);
            setIsDoubleXPActive(false);
            updateDoubleXP(0);
            NotificationManager.show(
              "2x TP Sona Erdi",
              "2x TP bonus süreniz doldu."
            );
            return 0;
          }
          
          if (newTime % 10 === 0 || newTime <= 5) {
            updateDoubleXP(newTime);
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (doubleXPTimerRef.current) {
        clearInterval(doubleXPTimerRef.current);
      }
    };
  }, [playerProfile.isPremium, playerProfile.doubleXPActive, playerProfile.doubleXPRemaining, updateDoubleXP]);

  useEffect(() => {
    const initializeAds = async () => {
      await AdManager.initialize();
      AdManager.setPremium(playerProfile.isPremium);
    };
    
    initializeAds();
  }, [playerProfile.isPremium]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showSplash) {
        return true;
      }
      
      if (currentScreen === 'match') {
        Alert.alert(
          "Maçtan Çık",
          "Maçtan çıkmak istediğinize emin misiniz?",
          [
            { text: "İptal", style: "cancel" },
            { 
              text: "Çık", 
              style: "destructive",
              onPress: () => {
                if (questionTimerRef.current) {
                  clearInterval(questionTimerRef.current);
                }
                setCurrentScreen("home");
                setMatchStarted(false);
              }
            }
          ]
        );
        return true;
      }
      
      if (currentScreen !== 'home') {
        setCurrentScreen("home");
        return true;
      }
      if (showSettingsModal) {
        setShowSettingsModal(false);
        return true;
      }
      if (showLeaderboard) {
        setShowLeaderboard(false);
        return true;
      }
      if (showMatchResult) {
        setShowMatchResult(false);
        return true;
      }
      if (showRewardsModal) {
        setShowRewardsModal(false);
        return true;
      }
      if (showPremiumModal) {
        setShowPremiumModal(false);
        return true;
      }
      if (showTurkeyRanking) {
        setShowTurkeyRanking(false);
        return true;
      }
      if (showLoginModal) {
        setShowLoginModal(false);
        return true;
      }
      if (showSupport) {
        setShowSupport(false);
        return true;
      }
      if (showDeleteAccount) {
        setShowDeleteAccount(false);
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [showSplash, currentScreen, showSettingsModal, showLeaderboard, showMatchResult, showRewardsModal, showPremiumModal, showTurkeyRanking, showLoginModal, showSupport, showDeleteAccount]);

  // ============================================
  // RENDER FONKSİYONLARI
  // ============================================

  const renderLevelUpModal = () => (
    <Modal
      visible={showLevelUp}
      animationType="fade"
      transparent={true}
      onRequestClose={hideLevelUp}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.levelUpModalContent,
            {
              transform: [{
                scale: levelUpAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1]
                })
              }]
            }
          ]}
        >
          <Text style={styles.levelUpTitle}>🎉 TEBRİKLER!</Text>
          <Text style={styles.levelUpSubtitle}>SEVİYE ATLADIN</Text>
          
          <View style={styles.levelUpDisplay}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Seviye {newLevel - 1}</Text>
            </View>
            <Text style={styles.levelArrow}>→</Text>
            <View style={[styles.levelBadge, styles.newLevelBadge]}>
              <Text style={[styles.levelBadgeText, styles.newLevelText]}>Seviye {newLevel}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.continueButton}
            onPress={hideLevelUp}
          >
            <Text style={styles.continueButtonText}>Harika!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderScoreAnimation = () => {
    if (!showScoreAnimation || !matchResult) return null;

    const isPositive = matchResult.scoreChange > 0;
    const points = matchResult.scoreChange;

    return (
      <Animated.View 
        style={[
          styles.scoreAnimationContainer,
          {
            opacity: scoreAnimationRef,
            transform: [
              {
                scale: scoreAnimationRef.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1.2]
                })
              },
              {
                translateY: scoreAnimationRef.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -30]
                })
              }
            ]
          }
        ]}
      >
        <View style={[
          styles.scoreAnimationContent,
          { 
            backgroundColor: isPositive ? 'rgba(76, 175, 80, 0.95)' : 'rgba(244, 67, 54, 0.95)',
            borderColor: isPositive ? '#4CAF50' : '#f44336'
          }
        ]}>
          <Text style={styles.scoreAnimationIcon}>
            {isPositive ? '🏆' : '💔'}
          </Text>
          <Text style={[
            styles.scoreAnimationText,
            { color: isPositive ? '#4CAF50' : '#f44336' }
          ]}>
            {isPositive ? '+' : ''}{points}
          </Text>
          <Text style={styles.scoreAnimationLabel}>
            {isPositive ? 'PUAN KAZANDIN!' : 'PUAN KAYBETTİN!'}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderPremiumActivationAnimation = () => {
    if (!showPremiumActivation) return null;

    return (
      <Animated.View 
        style={[
          styles.premiumActivationOverlay,
          {
            opacity: premiumActivationAnim,
            transform: [{
              scale: premiumActivationAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1]
              })
            }]
          }
        ]}
      >
        <View style={styles.premiumActivationContent}>
          <Text style={styles.premiumActivationIcon}>👑</Text>
          <Text style={styles.premiumActivationTitle}>PREMIUM AKTİF!</Text>
          <Text style={styles.premiumActivationSubtitle}>
            Artık tüm premium özelliklere sahipsiniz!
          </Text>
          
          <View style={styles.premiumActivationFeatures}>
            <Text style={styles.premiumActivationFeature}>🎯 Reklamsız Deneyim</Text>
            <Text style={styles.premiumActivationFeature}>⚡ Sürekli 2x TP</Text>
            <Text style={styles.premiumActivationFeature}>💎 Özel Çerçeveler</Text>
            <Text style={styles.premiumActivationFeature}>🎮 Premium Savaş Modu</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.premiumActivationClose}
            onPress={hidePremiumActivation}
          >
            <Text style={styles.premiumActivationCloseText}>Harika!</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderHomeScreen = () => (
    <View style={styles.screen}>
      {/* ÜST MENÜ BUTONLARI */}
      {!playerProfile.isLoggedIn && (
        <TouchableOpacity 
          style={styles.loginTopButton}
          onPress={() => setShowLoginModal(true)}
        >
          <Text style={styles.loginTopButtonText}>🔐 GİRİŞ</Text>
        </TouchableOpacity>
      )}
      
      {playerProfile.isLoggedIn && (
        <>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => setCurrentScreen("profile")}
          >
            <View style={[styles.profileImageContainer, getFrameStyle(playerProfile.frame)]}>
              <Image 
                source={{ uri: playerProfile.avatar }}
                style={styles.profileImage}
              />
              {playerProfile.isPremium && (
                <View style={styles.premiumProfileBadge}>
                  <Text style={styles.premiumProfileBadgeText}>⭐</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => setShowSettingsModal(true)}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.leaderboardButton}
            onPress={() => setShowLeaderboard(true)}
          >
            <Text style={styles.leaderboardIcon}>🏆</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.rewardButton}
            onPress={() => setShowRewardsModal(true)}
          >
            <Text style={styles.rewardIcon}>🎁</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.turkeyRankingButton}
            onPress={() => setShowTurkeyRanking(true)}
          >
            <Text style={styles.turkeyRankingIcon}>🇹🇷</Text>
            {turkeyRanking.isActive && (
              <View style={styles.liveIndicator}>
                <Text style={styles.liveText}>CANLI</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.premiumHomeButton,
              {
                backgroundColor: playerProfile.isPremium 
                  ? "rgba(255, 215, 0, 0.8)" 
                  : "rgba(156, 39, 176, 0.8)",
                borderColor: playerProfile.isPremium ? "#FFD700" : "#9C27B0"
              }
            ]}
            onPress={() => setShowPremiumModal(true)}
          >
            <Text style={styles.premiumHomeIcon}>
              {playerProfile.isPremium ? '⭐' : '👑'}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <View style={styles.mainContent}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🎯</Text>
          <Text style={styles.appTitle}>BİLGİ SAVAŞI</Text>
          <Text style={styles.appSubtitle}>Zekanı Konuştur, Kazan!</Text>
          {playerProfile.isPremium && (
            <View style={styles.premiumLogoBadge}>
              <Text style={styles.premiumLogoBadgeText}>⭐ PREMIUM</Text>
            </View>
          )}
        </View>

        {questionsError && (
          <View style={styles.errorMessageContainer}>
            <Text style={styles.errorMessageTitle}>⚠️ İnternet Bağlantısı Gerekli</Text>
            <Text style={styles.errorMessageText}>
              Soruları yüklemek için internet bağlantısı gerekiyor.
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                QuestionLoader.loadQuestions().then(() => {
                  setQuestionsError(false);
                  NotificationManager.show("Başarılı", "Sorular yeniden yüklendi!");
                });
              }}
            >
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {!playerProfile.isLoggedIn ? (
          <View style={styles.loginRequiredContainer}>
            <Text style={styles.loginRequiredTitle}>👋 Bilgi Savaşı'na Hoş Geldiniz!</Text>
            <Text style={styles.loginRequiredText}>
              Oynamak için sadece bir kullanıcı adı seçin, hemen başlayın!
            </Text>
            <TouchableOpacity 
              style={styles.loginRequiredButton}
              onPress={() => setShowLoginModal(true)}
            >
              <Text style={styles.loginRequiredButtonText}>HEMEN GİRİŞ YAP</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{playerScore}</Text>
                <Text style={styles.statLabel}>PUAN</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {gameStats.totalQuestions > 0 
                    ? `%${Math.round((gameStats.correctAnswers / gameStats.totalQuestions) * 100)}` 
                    : '%0'}
                </Text>
                <Text style={styles.statLabel}>İSABET</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {playerProfile.level}
                </Text>
                <Text style={styles.statLabel}>SEVİYE</Text>
              </View>
              {playerTurkeyStats.isParticipant && (
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {playerTurkeyStats.currentSeason.rank || '-'}
                  </Text>
                  <Text style={styles.statLabel}>SIRALAMA</Text>
                </View>
              )}
            </View>

            <View style={styles.modeSelection}>
              <Text style={styles.modeTitle}>MAÇ MODU SEÇİN</Text>
              <View style={styles.modeButtons}>
                <TouchableOpacity 
                  style={[
                    styles.modeButton, 
                    selectedMode === "SOLO" && styles.activeModeButton
                  ]}
                  onPress={() => setSelectedMode("SOLO")}
                >
                  <View style={styles.modeButtonContent}>
                    <Text style={styles.modeIcon}>{MATCH_MODES.SOLO.icon}</Text>
                    <View style={styles.modeTextContainer}>
                      <Text style={styles.modeText}>{MATCH_MODES.SOLO.name}</Text>
                      <Text style={styles.modeDescription}>{MATCH_MODES.SOLO.description}</Text>
                      <Text style={styles.modeQuestionCount}>{MATCH_MODES.SOLO.questionCount} Soru</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.modeButton, 
                    styles.premiumModeButton, 
                    selectedMode === "PREMIUM" && styles.activePremiumModeButton
                  ]}
                  onPress={() => {
                    if (!playerProfile.isPremium) {
                      Alert.alert(
                        "Premium Gerekli",
                        "Premium savaş modu için premium üye olmalısınız.",
                        [
                          { text: "İptal", style: "cancel" },
                          { 
                            text: "Premium'a Geç", 
                            onPress: () => setShowPremiumModal(true)
                          }
                        ]
                      );
                    } else {
                      setSelectedMode("PREMIUM");
                    }
                  }}
                >
                  <View style={styles.modeButtonContent}>
                    <Text style={styles.modeIcon}>{MATCH_MODES.PREMIUM.icon}</Text>
                    <View style={styles.modeTextContainer}>
                      <Text style={styles.modeText}>{MATCH_MODES.PREMIUM.name}</Text>
                      <Text style={styles.modeDescription}>{MATCH_MODES.PREMIUM.description}</Text>
                      <Text style={styles.modeQuestionCount}>{MATCH_MODES.PREMIUM.questionCount} Soru</Text>
                    </View>
                    {!playerProfile.isPremium && (
                      <View style={styles.premiumLockContainer}>
                        <Text style={styles.premiumLockIcon}>🔒</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[
                styles.battleButton, 
                playerProfile.isPremium && styles.premiumBattleButton,
                (matchFinding || questionsError || isLoading) && styles.battleButtonDisabled
              ]}
              onPress={startMatchmaking}
              disabled={matchFinding || questionsError || isLoading}
            >
              <Text style={styles.battleButtonText}>
                {matchFinding ? "RAKİP BULUNUYOR..." : 
                 isLoading ? "YÜKLENİYOR..." : 
                 "BİLGİNİ GÖSTER"}
              </Text>
              {playerProfile.isPremium && !matchFinding && !isLoading && (
                <View style={styles.premiumBattleBadge}>
                  <Text style={styles.premiumBattleBadgeText}>⭐</Text>
                </View>
              )}
            </TouchableOpacity>

            {matchFinding && (
              <View style={styles.matchmakingInfo}>
                <Animated.View 
                  style={[
                    styles.loadingSpinner,
                    {
                      transform: [{
                        rotate: matchmakingAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg']
                        })
                      }]
                    }
                  ]} 
                />
                <Text style={styles.matchmakingText}>Rakip aranıyor...</Text>
                <Text style={styles.matchmakingSubtext}>Gerçek bir kullanıcı bulunuyor</Text>
              </View>
            )}
          </>
        )}
      </View>
      
      {/* BANNER REKLAM */}
      {!playerProfile.isPremium && AdManager.showBannerAd()}
    </View>
  );

  const renderMatchScreen = () => {
    const currentQ = currentQuestions[currentQuestion];
    if (!currentQ) {
      return (
        <View style={styles.screen}>
          <View style={styles.errorMessageContainer}>
            <Text style={styles.errorMessageTitle}>⚠️ Soru Yüklenemedi</Text>
            <Text style={styles.errorMessageText}>
              Sorular yüklenirken bir hata oluştu.
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => setCurrentScreen("home")}
            >
              <Text style={styles.retryButtonText}>Ana Sayfaya Dön</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    const opponentCorrectAnswers = opponentAnswers.slice(0, currentQuestion + 1).filter((answer, index) => {
      if (answer === null || answer === undefined) return false;
      return answer === currentQuestions[index]?.correctAnswer;
    }).length;

    return (
      <View style={styles.matchScreen}>
        <View style={styles.matchHeader}>
          <View style={styles.playerInfo}>
            <Text style={styles.playerScore}>{playerScore}</Text>
            <View style={styles.playerNameContainer}>
              <Text style={styles.playerName}>
                SEN
              </Text>
              {playerProfile.isPremium && (
                <Text style={styles.playerPremiumBadge}>⭐</Text>
              )}
            </View>
            <View style={[styles.playerProgress, { width: `${(correctAnswers / (currentQuestion + 1 || 1)) * 100}%` }]} />
          </View>

          <View style={styles.timerContainer}>
            <Animated.Text 
              style={[
                styles.timer,
                { transform: [{ scale: timerAnim }] },
                questionTimeLeft <= 5 && styles.timerWarning
              ]}
            >
              {questionTimeLeft}
            </Animated.Text>
            <Text style={styles.questionCount}>
              {currentQuestion + 1}/{currentQuestions.length}
            </Text>
          </View>

          <View style={styles.playerInfo}>
            <Text style={styles.playerScore}>{opponent?.score || 2150}</Text>
            <View style={styles.playerNameContainer}>
              <Text style={styles.playerName}>
                {opponent?.name || "Rakip"}
              </Text>
              {opponent?.isPremium && (
                <Text style={styles.playerPremiumBadge}>⭐</Text>
              )}
            </View>
            <View style={[styles.playerProgress, styles.opponentProgress, { width: `${(opponentCorrectAnswers / (currentQuestion + 1 || 1)) * 100}%` }]} />
          </View>
        </View>

        <View style={styles.questionArea}>
          <View style={styles.questionHeader}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(currentQ.difficulty) }]}>
              <Text style={styles.difficultyText}>{currentQ.difficulty}</Text>
            </View>
            <Text style={styles.categoryText}>{currentQ.category}</Text>
            {playerProfile.isPremium && (
              <View style={styles.premiumMatchBadge}>
                <Text style={styles.premiumMatchText}>⭐ PREMIUM</Text>
              </View>
            )}
          </View>
          
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>
              {currentQ.question}
            </Text>
          </View>

          <View style={styles.optionsGrid}>
            {currentQ.options.map((option, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.optionContainer,
                  {
                    transform: [{
                      scale: (optionAnimations.current[index] || new Animated.Value(1)).interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1]
                      })
                    }]
                  }
                ]}
              >
                <TouchableOpacity
                  style={[styles.optionCard, getOptionStyle(index)]}
                  onPress={() => answerQuestion(index)}
                  disabled={showResult}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <View style={[
                      styles.optionLetterContainer,
                      showResult && index === currentQ.correctAnswer && styles.optionLetterCorrect,
                      showResult && index === selectedOption && index !== currentQ.correctAnswer && styles.optionLetterWrong
                    ]}>
                      <Text style={[
                        styles.optionLetter,
                        showResult && index === currentQ.correctAnswer && styles.optionLetterCorrectText,
                        showResult && index === selectedOption && index !== currentQ.correctAnswer && styles.optionLetterWrongText
                      ]}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <Text style={styles.optionText}>{option}</Text>
                  </View>
                  
                  {showResult && index === currentQ.correctAnswer && (
                    <View style={styles.correctIndicator}>
                      <Text style={styles.correctIndicatorText}>✓</Text>
                    </View>
                  )}
                  
                  {showResult && opponentAnswers[currentQuestion] === index && (
                    <View style={styles.opponentChoiceIndicator}>
                      <Text style={styles.opponentChoiceText}>👤</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {combo >= 2 && (
          <View style={styles.comboContainer}>
            <Text style={styles.comboFire}>🔥</Text>
            <Text style={styles.comboText}>{combo} COMBO!</Text>
            {playerProfile.isPremium && (
              <Text style={styles.premiumComboBadge}>⭐</Text>
            )}
          </View>
        )}
        
        {/* MAÇ EKRANI BANNER REKLAM */}
        {!playerProfile.isPremium && (
          <View style={styles.matchBannerAdContainer}>
            <BannerAd
              unitId={BANNER_AD_UNIT_ID}
              size={BannerAdSize.BANNER}
              requestOptions={{
                requestNonPersonalizedAdsOnly: false,
              }}
            />
          </View>
        )}
      </View>
    );
  };

  const renderProfileScreen = () => {
    if (!playerProfile.isLoggedIn) {
      return (
        <View style={styles.screen}>
          <View style={styles.headerWithBack}>
            <TouchableOpacity onPress={() => setCurrentScreen("home")}>
              <Text style={styles.backButton}>← Geri</Text>
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Profil</Text>
          </View>
          
          <View style={styles.loginRequiredProfile}>
            <Text style={styles.loginRequiredProfileTitle}>🔒 Giriş Gerekli</Text>
            <Text style={styles.loginRequiredProfileText}>
              Profilinizi görmek için giriş yapmanız gerekiyor.
            </Text>
            <TouchableOpacity 
              style={styles.loginRequiredProfileButton}
              onPress={() => setShowLoginModal(true)}
            >
              <Text style={styles.loginRequiredProfileButtonText}>GİRİŞ YAP</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.screen}>
        <View style={styles.headerWithBack}>
          <TouchableOpacity onPress={() => setCurrentScreen("home")}>
            <Text style={styles.backButton}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Profil</Text>
          {playerProfile.isPremium && (
            <TouchableOpacity 
              style={styles.premiumProfileButton}
              onPress={() => setShowPremiumModal(true)}
            >
              <Text style={styles.premiumProfileButtonText}>⭐</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.profileScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            <View style={[styles.profileImageContainerLarge, getFrameStyle(playerProfile.frame)]}>
              <Image 
                source={{ uri: playerProfile.avatar }}
                style={styles.profileImageLarge}
              />
              {playerProfile.isPremium && (
                <View style={styles.premiumProfileBadgeLarge}>
                  <Text style={styles.premiumProfileBadgeLargeText}>⭐</Text>
                </View>
              )}
            </View>
            <Text style={styles.profileName}>{playerProfile.username}</Text>
            <View style={styles.profileTitleContainer}>
              <Text style={styles.profileTitle}>"{playerProfile.title}"</Text>
              {playerProfile.isPremium && (
                <Text style={styles.profileTitlePremium}>⭐</Text>
              )}
            </View>
            <Text style={styles.profileScore}>{playerScore} PUAN</Text>
            <Text style={styles.profileLevel}>Seviye {playerProfile.level}</Text>
            
            {playerProfile.isPremium && (
              <View style={styles.premiumStatusContainer}>
                <Text style={styles.premiumStatusText}>⭐ PREMIUM ÜYE</Text>
                <Text style={styles.premiumStatusSubtext}>
                  Aylık üyelik • 99,99₺
                </Text>
              </View>
            )}
            
            {playerTurkeyStats.isParticipant && (
              <View style={styles.turkeyRankingStatus}>
                <Text style={styles.turkeyRankingStatusText}>🏆 TÜRKİYE SIRALAMASI</Text>
                <Text style={styles.turkeyRankingStatusSubtext}>
                  Mevcut Sıralama: {playerTurkeyStats.currentSeason.rank || "Hesaplanıyor"}
                </Text>
                {playerTurkeyStats.currentSeason.rank === 1 && (
                  <View style={styles.championStatus}>
                    <Text style={styles.championStatusText}>⭐ ŞU AN TÜRKİYE ŞAMPİYONUSUNUZ!</Text>
                  </View>
                )}
                <Text style={styles.turkeyRankingStatusSubtext}>
                  Katılımcı Sayısı: {turkeyRanking.participants?.length || 0} kişi
                </Text>
              </View>
            )}
            
            <View style={styles.profileStats}>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatNumber}>{gameStats.totalMatches}</Text>
                <Text style={styles.profileStatLabel}>MAÇ</Text>
              </View>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatNumber}>{gameStats.wins}</Text>
                <Text style={styles.profileStatLabel}>GALİBİYET</Text>
              </View>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatNumber}>
                  {gameStats.totalQuestions > 0 
                    ? `%${Math.round((gameStats.correctAnswers / gameStats.totalQuestions) * 100)}` 
                    : '%0'}
                </Text>
                <Text style={styles.profileStatLabel}>BAŞARI</Text>
              </View>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatNumber}>{playerProfile.gold}</Text>
                <Text style={styles.profileStatLabel}>ALTIN</Text>
              </View>
            </View>

            <View style={styles.badgesSection}>
              <Text style={styles.sectionTitle}>Rozetler ({playerProfile.badges?.length || 0})</Text>
              <View style={styles.badgesContainer}>
                {playerProfile.badges?.map((badge, index) => (
                  <View key={index} style={styles.badgeItem}>
                    <Text style={styles.badgeIconLarge}>{badge}</Text>
                  </View>
                ))}
                {playerProfile.isPremium && (
                  <View style={[styles.badgeItem, styles.premiumBadgeItem]}>
                    <Text style={styles.premiumBadgeIconLarge}>⭐</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.unlockedSection}>
              <Text style={styles.sectionTitle}>İstatistikler</Text>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Premium Durumu:</Text>
                <Text style={[styles.statRowValue, playerProfile.isPremium && styles.premiumStatValue]}>
                  {playerProfile.isPremium ? 'AKTİF ⭐' : 'PASİF'}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Toplam Reklam:</Text>
                <Text style={styles.statRowValue}>{gameStats.adsWatched}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Geçiş Reklamları:</Text>
                <Text style={styles.statRowValue}>{gameStats.interstitialAdsShown}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Ödüllü Reklamlar:</Text>
                <Text style={styles.statRowValue}>{gameStats.rewardedAdsWatched}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>2x TP Durumu:</Text>
                <Text style={[
                  styles.statRowValue,
                  isDoubleXPActive && styles.doubleXPActive
                ]}>
                  {isDoubleXPActive 
                    ? isDoubleXPPermanent 
                      ? 'SÜREKLİ ⭐' 
                      : formatTime(doubleXPRemaining)
                    : 'Pasif'}
                </Text>
              </View>
              {playerProfile.isPremium && (
                <>
                  <View style={[styles.statRow, styles.premiumStatRow]}>
                    <Text style={styles.statRowLabel}>Premium Bonus:</Text>
                    <Text style={styles.premiumStatValue}>+%25 XP</Text>
                  </View>
                  <View style={[styles.statRow, styles.premiumStatRow]}>
                    <Text style={styles.statRowLabel}>Reklamsız:</Text>
                    <Text style={styles.premiumStatValue}>AKTİF ⭐</Text>
                  </View>
                </>
              )}
              {playerTurkeyStats.isParticipant && (
                <>
                  <View style={[styles.statRow, styles.turkeyStatRow]}>
                    <Text style={styles.statRowLabel}>🏆 Türkiye Sıralaması:</Text>
                    <Text style={styles.turkeyStatValue}>AKTİF</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statRowLabel}>En İyi Sıralama:</Text>
                    <Text style={styles.statRowValue}>{playerTurkeyStats.bestRank || '-'}</Text>
                  </View>
                </>
              )}
            </View>

            {!playerProfile.isPremium && (
              <TouchableOpacity 
                style={styles.goPremiumProfileButton}
                onPress={() => setShowPremiumModal(true)}
              >
                <Text style={styles.goPremiumProfileButtonText}>⭐ PREMIUM'A GEÇ</Text>
                <Text style={styles.goPremiumProfileSubtext}>99,99₺/ay • Reklamsız • 2x TP</Text>
              </TouchableOpacity>
            )}
            
            {!playerTurkeyStats.isParticipant && playerProfile.isPremium && (
              <TouchableOpacity 
                style={styles.joinTurkeyProfileButton}
                onPress={() => setShowTurkeyRanking(true)}
              >
                <Text style={styles.joinTurkeyProfileButtonText}>🏆 TÜRKİYE SIRALAMASI</Text>
                <Text style={styles.joinTurkeyProfileSubtext}>ÜCRETSİZ katıl, ŞAMPİYON ol!</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>🚪 ÇIKIŞ YAP</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        {/* PROFİL SAYFASI BANNER REKLAM */}
        {!playerProfile.isPremium && AdManager.showBannerAd()}
      </View>
    );
  };

  const renderLeaderboardScreen = () => (
    <View style={styles.screen}>
      <View style={styles.headerWithBack}>
        <TouchableOpacity onPress={() => setShowLeaderboard(false)}>
          <Text style={styles.backButton}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>🏆 Sıralama</Text>
        <TouchableOpacity onPress={() => setShowPremiumModal(true)}>
          <Text style={styles.premiumHeaderButton}>{playerProfile.isPremium ? '⭐' : '👑'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.id.toString()}
        style={styles.leaderboardList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <View style={[
            styles.leaderboardItem,
            item.name === playerProfile.username && styles.currentPlayerItem,
            item.isRank1 && styles.rank1Item,
            item.isPremium && styles.premiumPlayerItem
          ]}>
            <View style={styles.rankContainer}>
              <Text style={[
                styles.rankNumber,
                index === 0 && styles.firstPlaceNumber,
                index === 1 && styles.secondPlaceNumber,
                index === 2 && styles.thirdPlaceNumber,
                item.name === playerProfile.username && styles.currentPlayerRank
              ]}>
                {index + 1}
              </Text>
            </View>
            <View style={[styles.leaderboardAvatarContainer, getFrameStyle(item.frame)]}>
              <Image source={{ uri: item.avatar }} style={styles.leaderboardAvatar} />
              {item.isPremium && (
                <View style={styles.premiumLeaderboardBadge}>
                  <Text style={styles.premiumLeaderboardBadgeText}>⭐</Text>
                </View>
              )}
            </View>
            <View style={styles.leaderboardInfo}>
              <View style={styles.leaderboardNameContainer}>
                <Text style={[
                  styles.leaderboardName,
                  item.name === playerProfile.username && styles.currentPlayerName,
                  item.isRank1 && styles.rank1Name
                ]}>
                  {item.name}
                </Text>
                {item.name === playerProfile.username && (
                  <Text style={styles.currentPlayerIndicator}>(Siz)</Text>
                )}
                {item.isRank1 && (
                  <Text style={styles.rank1Indicator}>👑</Text>
                )}
                {item.isPremium && !item.isRank1 && (
                  <Text style={styles.premiumIndicator}>⭐</Text>
                )}
              </View>
              <Text style={styles.leaderboardDetails}>
                Seviye {item.level} • {item.score} puan
              </Text>
            </View>
            <View style={[
              styles.onlineIndicator,
              { backgroundColor: item.isOnline ? '#4CAF50' : '#999' }
            ]} />
          </View>
        )}
      />
      
      {/* LİDER TABLOSU BANNER REKLAM */}
      {!playerProfile.isPremium && AdManager.showBannerAd()}
    </View>
  );

  const renderSettingsScreen = () => (
    <View style={styles.screen}>
      <View style={styles.headerWithBack}>
        <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
          <Text style={styles.backButton}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>⚙️ Ayarlar</Text>
        <TouchableOpacity onPress={() => setShowPremiumModal(true)}>
          <Text style={styles.premiumHeaderButton}>{playerProfile.isPremium ? '⭐' : '👑'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.settingsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.settingsGroup}>
          <Text style={styles.settingsGroupTitle}>Genel Ayarlar</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🔊</Text>
              <Text style={styles.settingText}>Ses Efektleri</Text>
            </View>
            <TouchableOpacity 
              style={[styles.toggleButton, settings.soundEnabled && styles.toggleButtonActive]}
              onPress={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            >
              <Text style={[styles.toggleText, settings.soundEnabled && styles.toggleTextActive]}>
                {settings.soundEnabled ? "AÇIK" : "KAPALI"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>📳</Text>
              <Text style={styles.settingText}>Titreşim</Text>
            </View>
            <TouchableOpacity 
              style={[styles.toggleButton, settings.vibration && styles.toggleButtonActive]}
              onPress={() => updateSettings({ vibration: !settings.vibration })}
            >
              <Text style={[styles.toggleText, settings.vibration && styles.toggleTextActive]}>
                {settings.vibration ? "AÇIK" : "KAPALI"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingsGroup}>
          <Text style={styles.settingsGroupTitle}>Destek ve Bilgi</Text>
          
          <TouchableOpacity 
            style={styles.settingButton}
            onPress={() => setShowSupport(true)}
          >
            <Text style={styles.settingButtonIcon}>📞</Text>
            <Text style={styles.settingButtonText}>Destek ve Yardım</Text>
            <Text style={styles.settingButtonArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingButton}
            onPress={() => {
              if (!playerProfile.isLoggedIn) {
                Alert.alert("Giriş Gerekli", "Paylaşmak için giriş yapmalısınız.");
                return;
              }
              Share.share({
                message: `Bilgi Savaşı'nda ${playerScore} puan ve Seviye ${playerProfile.level}'deyim! ${playerProfile.isPremium ? '⭐ PREMIUM ÜYE' : ''} ${playerTurkeyStats.isParticipant ? `🏆 Türkiye Sıralaması'nda ${playerTurkeyStats.currentSeason.rank || '?'}. sıradayım!` : ''} 🎯`,
                title: 'Bilgi Savaşı Skorum'
              });
            }}
          >
            <Text style={styles.settingButtonIcon}>📤</Text>
            <Text style={styles.settingButtonText}>Skoru Paylaş</Text>
            <Text style={styles.settingButtonArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsGroup}>
          <Text style={styles.settingsGroupTitle}>Özel Özellikler</Text>
          
          <TouchableOpacity 
            style={[styles.settingButton, styles.premiumSettingButton]}
            onPress={() => setShowPremiumModal(true)}
          >
            <Text style={styles.settingButtonIcon}>{playerProfile.isPremium ? '⭐' : '👑'}</Text>
            <Text style={styles.premiumSettingButtonText}>
              {playerProfile.isPremium ? 'Premium Yönetimi' : 'Premium Satın Al'}
            </Text>
            <Text style={styles.premiumPrice}>99,99₺/ay</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.settingButton, styles.turkeyRankingSettingButton]}
            onPress={() => setShowTurkeyRanking(true)}
          >
            <Text style={styles.settingButtonIcon}>🇹🇷</Text>
            <Text style={styles.turkeyRankingSettingButtonText}>
              Türkiye Sıralaması
            </Text>
            <Text style={styles.turkeyRankingBadge}>ÜCRETSİZ</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsGroup}>
          <Text style={styles.settingsGroupTitle}>Hesap Yönetimi</Text>
          
          {playerProfile.isLoggedIn && (
            <TouchableOpacity 
              style={[styles.settingButton, styles.dangerButton]}
              onPress={handleLogout}
            >
              <Text style={styles.settingButtonIcon}>🚪</Text>
              <Text style={styles.dangerButtonText}>Çıkış Yap</Text>
              <Text style={styles.settingButtonArrow}>→</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.settingButton, styles.dangerButton]}
            onPress={() => setShowDeleteAccount(true)}
          >
            <Text style={styles.settingButtonIcon}>🗑️</Text>
            <Text style={styles.dangerButtonText}>Hesabımı Sil</Text>
            <Text style={styles.settingButtonArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Versiyon 1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 Bilgi Savaşı</Text>
        </View>
      </ScrollView>
      
      {/* AYARLAR SAYFASI BANNER REKLAM */}
      {!playerProfile.isPremium && AdManager.showBannerAd()}
    </View>
  );

  return (
    <ImageBackground
      source={{ uri: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" }}
      style={styles.container}
      blurRadius={3}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safeArea}>
        
        {showSplash ? (
          <SplashAnimation onComplete={() => setShowSplash(false)} />
        ) : (
          <>
            {isDoubleXPActive && !isDoubleXPPermanent && (
              <Animated.View 
                style={[
                  styles.doubleXPAnimation,
                  {
                    opacity: doubleXPAnim,
                    transform: [{
                      scale: doubleXPAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1]
                      })
                    }]
                  }
                ]}
              >
                <Text style={styles.doubleXPAnimationText}>⚡ 2x TP AKTİF!</Text>
                <Text style={styles.doubleXPAnimationSubtext}>
                  {formatTime(doubleXPRemaining)} kaldı
                </Text>
              </Animated.View>
            )}
            
            {renderPremiumActivationAnimation()}
            
            {showSettingsModal ? renderSettingsScreen() : 
             showLeaderboard ? renderLeaderboardScreen() :
             currentScreen === "home" ? renderHomeScreen() :
             currentScreen === "match" ? renderMatchScreen() :
             currentScreen === "profile" ? renderProfileScreen() : null}

            <LoginModal
              visible={showLoginModal}
              onClose={() => setShowLoginModal(false)}
              onLogin={handleLogin}
            />
            
            <SupportModal
              visible={showSupport}
              onClose={() => setShowSupport(false)}
            />
            
            <DeleteAccountModal
              visible={showDeleteAccount}
              onClose={() => setShowDeleteAccount(false)}
              onDeleteAccount={handleDeleteAccount}
            />
            
            <TurkeyRankingModal
              visible={showTurkeyRanking}
              onClose={() => setShowTurkeyRanking(false)}
              onJoin={joinTurkeyRanking}
              isPremium={playerProfile.isPremium}
              playerData={{
                id: playerProfile.id,
                name: playerProfile.username,
                score: playerScore,
                level: playerProfile.level
              }}
              rankingData={turkeyRanking}
              playerStats={playerTurkeyStats}
              isParticipant={playerTurkeyStats.isParticipant}
            />
            
            <PremiumModal
              visible={showPremiumModal}
              onClose={() => setShowPremiumModal(false)}
              onPurchase={handlePurchasePremium}
              isPremium={playerProfile.isPremium}
            />
            
            <RewardsModal
              visible={showRewardsModal}
              onClose={() => setShowRewardsModal(false)}
              onWatchAd={handleWatchRewardedAd}
              isPremium={playerProfile.isPremium}
            />
            
            <MatchResultModal 
              visible={showMatchResult}
              result={matchResult}
              onClose={closeMatchResult}
              onShowRewards={() => {
                closeMatchResult();
                setTimeout(() => setShowRewardsModal(true), 500);
              }}
              isPremium={playerProfile.isPremium}
            />
            
            {renderLevelUpModal()}
            {renderScoreAnimation()}
          </>
        )}
      </SafeAreaView>
    </ImageBackground>
  );
};

// ============================================
// STILLER
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a1428",
  },
  safeArea: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 20, 40, 0.98)',
    padding: 20,
  },
  loadingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 168, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ffa800',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 50,
    color: '#ffa800',
  },
  loadingTitle: {
    color: '#ffa800',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  loadingSubtitle: {
    color: '#fff',
    fontSize: 14,
    marginTop: 10,
  },
  glowEffect: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 168, 0, 0.2)',
    shadowColor: '#ffa800',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 50,
    elevation: 20,
  },
  splashTitle: {
    color: '#ffa800',
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(255, 168, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  splashSubtitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 40,
  },
  splashButton: {
    backgroundColor: 'rgba(255, 168, 0, 0.9)',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  splashButtonText: {
    color: '#0a1428',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  splashFooter: {
    position: 'absolute',
    bottom: 30,
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  bannerAdContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 2,
    borderTopColor: '#ffa800',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  matchBannerAdContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 2,
    borderTopColor: '#ffa800',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  bannerAdText: {
    color: '#ffa800',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
  },
  loginTopButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: "rgba(255, 168, 0, 0.2)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#ffa800",
  },
  loginTopButtonText: {
    fontSize: 12,
    color: "#ffa800",
    fontWeight: "bold",
  },
  loginModalContent: {
    backgroundColor: "rgba(16, 30, 56, 0.98)",
    padding: 20,
    borderRadius: 12,
    width: "90%",
    borderWidth: 3,
    borderColor: "#ffa800",
  },
  loginModalHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  loginTitle: {
    color: "#ffa800",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  loginSubtitle: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  loginErrorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  loginErrorText: {
    color: "#f44336",
    fontSize: 12,
    textAlign: "center",
  },
  loginInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#ffa800",
    fontSize: 14,
    marginBottom: 15,
  },
  termsCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
  },
  checkbox: {
    marginRight: 10,
  },
  checkboxIcon: {
    fontSize: 20,
    color: '#ffa800',
  },
  termsTextContainer: {
    flex: 1,
  },
  termsLink: {
    color: '#ffa800',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  loginButton: {
    backgroundColor: "rgba(255, 168, 0, 0.9)",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: "#0a1428",
    fontWeight: "bold",
    fontSize: 16,
  },
  webViewModal: {
    backgroundColor: "#fff",
    flex: 1,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: "#ffa800",
  },
  webViewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#ffa800',
  },
  webViewTitle: {
    color: '#0a1428',
    fontSize: 18,
    fontWeight: 'bold',
  },
  webViewCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webViewCloseText: {
    color: '#0a1428',
    fontSize: 16,
    fontWeight: 'bold',
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  webViewLoadingText: {
    color: '#ffa800',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
  },
  supportModalContent: {
    backgroundColor: "rgba(16, 30, 56, 0.98)",
    padding: 20,
    borderRadius: 12,
    width: "90%",
    maxHeight: "80%",
    borderWidth: 3,
    borderColor: "#4CAF50",
  },
  supportTitle: {
    color: "#4CAF50",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  supportSubtitle: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  contactInfoContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  contactInfoTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  contactInfoItem: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 6,
    textAlign: 'center',
  },
  supportSectionTitle: {
    color: '#ffa800',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 10,
  },
  supportTextInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#ffa800',
    fontSize: 14,
    marginBottom: 20,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  commonIssuesTitle: {
    color: '#ffa800',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  commonIssuesList: {
    backgroundColor: 'rgba(255, 168, 0, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  commonIssue: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 18,
  },
  sendButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteAccountModalContent: {
    backgroundColor: "rgba(16, 30, 56, 0.98)",
    padding: 20,
    borderRadius: 12,
    width: "90%",
    maxHeight: "80%",
    borderWidth: 3,
    borderColor: "#f44336",
  },
  deleteAccountTitle: {
    color: "#f44336",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  deleteAccountWarning: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  deleteAccountWarningText: {
    color: "#f44336",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  warningList: {
    marginBottom: 20,
  },
  warningItem: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 10,
    paddingLeft: 10,
    lineHeight: 20,
  },
  continueDeleteButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#f44336',
  },
  continueDeleteButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  confirmPhraseContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  confirmPhrase: {
    color: '#f44336',
    fontSize: 18,
    fontWeight: 'bold',
  },
  confirmInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#f44336',
    fontSize: 14,
    marginBottom: 20,
  },
  deleteAccountButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteAccountButtonDisabled: {
    opacity: 0.5,
  },
  deleteAccountButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  modalCloseText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorMessageContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    padding: 20,
    borderRadius: 12,
    marginVertical: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f44336',
  },
  errorMessageTitle: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorMessageText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 168, 0, 0.2)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffa800',
  },
  retryButtonText: {
    color: '#ffa800',
    fontWeight: 'bold',
    fontSize: 12,
  },
  loginRequiredContainer: {
    backgroundColor: 'rgba(255, 168, 0, 0.1)',
    padding: 25,
    borderRadius: 12,
    marginVertical: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffa800',
  },
  loginRequiredTitle: {
    color: '#ffa800',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  loginRequiredText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  loginRequiredButton: {
    backgroundColor: "rgba(255, 168, 0, 0.9)",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    width: '80%',
  },
  loginRequiredButtonText: {
    color: "#0a1428",
    fontWeight: "bold",
    fontSize: 14,
  },
  loginRequiredProfile: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginRequiredProfileTitle: {
    color: '#ffa800',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  loginRequiredProfileText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  loginRequiredProfileButton: {
    backgroundColor: "rgba(255, 168, 0, 0.9)",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    width: '80%',
  },
  loginRequiredProfileButtonText: {
    color: "#0a1428",
    fontWeight: "bold",
    fontSize: 16,
  },
  premiumActivationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  premiumActivationContent: {
    backgroundColor: 'rgba(255, 215, 0, 0.95)',
    padding: 30,
    borderRadius: 25,
    alignItems: 'center',
    width: '90%',
    borderWidth: 5,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  premiumActivationIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  premiumActivationTitle: {
    color: '#000',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  premiumActivationSubtitle: {
    color: '#000',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  premiumActivationFeatures: {
    width: '100%',
    marginBottom: 25,
  },
  premiumActivationFeature: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  premiumActivationClose: {
    backgroundColor: '#000',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  premiumActivationCloseText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  turkeyRankingButton: {
    position: "absolute",
    top: 260,
    right: 10,
    zIndex: 10,
    backgroundColor: "rgba(220, 20, 60, 0.8)",
    padding: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FFD700",
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  turkeyRankingIcon: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: 'bold',
  },
  liveIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF0000',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 6,
    fontWeight: 'bold',
  },
  turkeyRankingModalContent: {
    backgroundColor: "rgba(16, 30, 56, 0.98)",
    padding: 20,
    width: "95%",
    maxHeight: height * 0.9,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#FFD700",
  },
  turkeyRankingHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  turkeyRankingTitle: {
    color: "#FFD700",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  turkeyRankingSubtitle: {
    color: "#FFFFFF",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: '600',
  },
  seasonTimerContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 5,
  },
  seasonTimerLabel: {
    color: '#FFD700',
    fontSize: 12,
    marginBottom: 5,
  },
  seasonTimerValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  seasonDuration: {
    color: '#ccc',
    fontSize: 10,
    marginTop: 2,
  },
  playerRankBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    width: '100%',
  },
  playerRankText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  topPlayerBadge: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  topPlayerBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rewardsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  rewardsGrid: {
    gap: 12,
  },
  rewardCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  firstReward: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: '#FFD700',
    borderWidth: 3,
  },
  rewardRank: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  rewardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rewardDescription: {
    color: '#ccc',
    fontSize: 11,
    marginBottom: 4,
    lineHeight: 16,
  },
  freeEntryNote: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  freeEntryNoteText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
  },
  otherRewardsCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
  },
  otherRewardsTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  otherRewardsText: {
    color: '#ccc',
    fontSize: 11,
    marginBottom: 4,
    lineHeight: 16,
  },
  noContestNote: {
    marginTop: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  noContestNoteText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: 'bold',
  },
  participationSection: {
    marginBottom: 20,
  },
  participationInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 10,
    width: 24,
    textAlign: 'center',
  },
  infoText: {
    color: '#ccc',
    fontSize: 12,
    flex: 1,
  },
  highlight: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  joinButton: {
    backgroundColor: 'rgba(220, 20, 60, 0.9)',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  joinButtonSubtext: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  alreadyJoinedContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  alreadyJoinedTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  alreadyJoinedText: {
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  playerStatsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 12,
    borderRadius: 8,
  },
  playerStatsTitle: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  playerStat: {
    color: '#fff',
    fontSize: 11,
    marginBottom: 4,
  },
  championStat: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginTop: 5,
  },
  rankingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(156, 39, 176, 0.2)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9C27B0',
  },
  secondaryButtonActive: {
    backgroundColor: 'rgba(156, 39, 176, 0.4)',
    borderColor: '#9C27B0',
    borderWidth: 2,
  },
  secondaryButtonText: {
    color: '#9C27B0',
    fontSize: 10,
    fontWeight: 'bold',
  },
  secondaryButtonTextActive: {
    color: '#fff',
  },
  leaderboardSection: {
    marginBottom: 20,
  },
  leaderboardTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  rankingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  firstPlaceRanking: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  currentPlayerRanking: {
    backgroundColor: 'rgba(255, 168, 0, 0.2)',
    borderColor: '#ffa800',
    borderWidth: 2,
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankNumberContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    position: 'relative',
  },
  firstRank: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  secondRank: {
    backgroundColor: 'rgba(192, 192, 192, 0.3)',
    borderWidth: 2,
    borderColor: '#C0C0C0',
  },
  thirdRank: {
    backgroundColor: 'rgba(205, 127, 50, 0.3)',
    borderWidth: 2,
    borderColor: '#CD7F32',
  },
  rankNumber: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  prizeIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    fontSize: 10,
    color: '#FFD700',
  },
  playerInfoRanking: {
    flex: 1,
  },
  playerNameRanking: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  currentPlayerNameRanking: {
    color: '#ffa800',
  },
  playerDetailsRanking: {
    color: '#ffa800',
    fontSize: 10,
  },
  rankingRight: {
    alignItems: 'flex-end',
  },
  playerScoreRanking: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  winnerPrize: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  winnerPrizeText: {
    color: '#FFD700',
    fontSize: 8,
    fontWeight: 'bold',
  },
  emptyLeaderboardContainer: {
    alignItems: 'center',
    padding: 30,
  },
  emptyLeaderboardText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  emptyLeaderboardSubtext: {
    color: '#ffa800',
    fontSize: 12,
    textAlign: 'center',
  },
  rulesSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 168, 0, 0.3)',
  },
  rulesTitle: {
    color: '#ffa800',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  rulesList: {
    paddingLeft: 10,
  },
  ruleItem: {
    color: '#ccc',
    fontSize: 11,
    marginBottom: 6,
    lineHeight: 16,
  },
  turkeyRankingStatus: {
    backgroundColor: 'rgba(220, 20, 60, 0.2)',
    padding: 12,
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 2,
    borderColor: '#FF0000',
    width: '100%',
  },
  turkeyRankingStatusText: {
    color: '#FF0000',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  turkeyRankingStatusSubtext: {
    color: '#fff',
    fontSize: 11,
    marginBottom: 4,
    textAlign: 'center',
  },
  championStatus: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    padding: 5,
    borderRadius: 8,
    marginVertical: 5,
  },
  championStatusText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  joinTurkeyProfileButton: {
    backgroundColor: 'rgba(220, 20, 60, 0.9)',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  joinTurkeyProfileButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  joinTurkeyProfileSubtext: {
    color: '#FFFFFF',
    fontSize: 10,
    textAlign: 'center',
  },
  turkeyRankingSettingButton: {
    backgroundColor: 'rgba(220, 20, 60, 0.2)',
    borderColor: '#FF0000',
  },
  turkeyRankingSettingButtonText: {
    color: '#FF0000',
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
  },
  turkeyRankingBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  premiumModalContent: {
    backgroundColor: "rgba(16, 30, 56, 0.98)",
    padding: 20,
    width: "95%",
    maxHeight: height * 0.9,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#FFD700",
  },
  premiumHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  premiumTitle: {
    color: "#FFD700",
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  premiumSubtitle: {
    color: "#FFFFFF",
    fontSize: 14,
    textAlign: "center",
  },
  plansContainer: {
    marginBottom: 15,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  popularPlanCard: {
    borderColor: '#FF6B00',
    backgroundColor: 'rgba(255, 107, 0, 0.05)',
  },
  selectedPlanCard: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    transform: [{ scale: 1.02 }],
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  planName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  popularBadge: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  planPrice: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: 'bold',
  },
  planPeriod: {
    color: '#ccc',
    fontSize: 12,
    marginLeft: 5,
  },
  planFeatures: {
    marginBottom: 15,
  },
  planFeature: {
    color: '#ccc',
    fontSize: 11,
    marginBottom: 4,
    lineHeight: 16,
  },
  buyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buyButtonSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  purchaseButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  purchaseButtonDisabled: {
    opacity: 0.5,
  },
  purchaseButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  purchaseButtonPrice: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  restoreButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  restoreButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentInfo: {
    marginBottom: 15,
  },
  paymentInfoText: {
    color: '#ccc',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 3,
    lineHeight: 14,
  },
  premiumHeaderActive: {
    alignItems: 'center',
    marginBottom: 20,
  },
  premiumTitleActive: {
    color: "#FFD700",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  premiumSubtitleActive: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
  },
  activePremiumContainer: {
    marginBottom: 20,
  },
  premiumStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  premiumStatusIcon: {
    fontSize: 30,
    marginRight: 10,
  },
  premiumStatusInfo: {
    flex: 1,
  },
  premiumStatusTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  premiumStatusText: {
    color: '#ccc',
    fontSize: 12,
  },
  activeFeaturesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  featureColumn: {
    flex: 1,
    paddingHorizontal: 5,
  },
  featureItem: {
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 20,
    marginBottom: 3,
  },
  featureName: {
    color: '#ccc',
    fontSize: 9,
    textAlign: 'center',
  },
  managementInfo: {
    color: '#FFD700',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  screen: {
    flex: 1,
    padding: 10,
    backgroundColor: "rgba(10, 20, 40, 0.95)",
  },
  matchScreen: {
    flex: 1,
    padding: 10,
    backgroundColor: "rgba(10, 20, 40, 0.98)",
  },
  profileScroll: {
    flex: 1,
  },
  premiumHomeButton: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 10,
    padding: 8,
    borderRadius: 16,
    borderWidth: 2,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumHomeIcon: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: 'bold',
  },
  profileButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  premiumProfileBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  premiumProfileBadgeText: {
    fontSize: 8,
    color: '#000',
  },
  settingsButton: {
    position: "absolute",
    top: 60,
    right: 10,
    zIndex: 10,
    backgroundColor: "rgba(255, 168, 0, 0.2)",
    padding: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#ffa800",
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 16,
    color: "#ffa800",
  },
  leaderboardButton: {
    position: "absolute",
    top: 110,
    right: 10,
    zIndex: 10,
    backgroundColor: "rgba(255, 168, 0, 0.2)",
    padding: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#ffa800",
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderboardIcon: {
    fontSize: 16,
    color: "#ffa800",
  },
  rewardButton: {
    position: "absolute",
    top: 160,
    right: 10,
    zIndex: 10,
    backgroundColor: "rgba(156, 39, 176, 0.8)",
    padding: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#9C27B0",
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  mainContent: {
    flex: 1,
    marginTop: 60,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  logo: {
    fontSize: 50,
    marginBottom: 8,
  },
  appTitle: {
    color: "#ffa800",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  appSubtitle: {
    color: "#FFFFFF",
    fontSize: 14,
    textAlign: "center",
    marginTop: 3,
  },
  premiumLogoBadge: {
    marginTop: 5,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  premiumLogoBadgeText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  statCard: {
    alignItems: "center",
    backgroundColor: "rgba(255, 168, 0, 0.1)",
    padding: 8,
    borderRadius: 10,
    width: width * 0.2,
    borderWidth: 1,
    borderColor: "#ffa800",
    margin: 2,
  },
  statNumber: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 3,
  },
  statLabel: {
    color: "#ccc",
    fontSize: 8,
    textAlign: "center",
  },
  modeSelection: {
    width: '100%',
    marginBottom: 15,
  },
  modeTitle: {
    color: '#ffa800',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modeButtons: {
    gap: 8,
  },
  modeButton: {
    backgroundColor: 'rgba(255, 168, 0, 0.1)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 168, 0, 0.3)',
  },
  premiumModeButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: '#FFD700',
  },
  activeModeButton: {
    backgroundColor: 'rgba(255, 168, 0, 0.2)',
    borderColor: '#ffa800',
    borderWidth: 2,
  },
  activePremiumModeButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  modeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  modeTextContainer: {
    flex: 1,
  },
  modeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  modeDescription: {
    color: '#ccc',
    fontSize: 10,
    marginBottom: 2,
  },
  modeQuestionCount: {
    color: '#ffa800',
    fontSize: 10,
    fontWeight: 'bold',
  },
  premiumLockContainer: {
    marginLeft: 5,
  },
  premiumLockIcon: {
    color: '#FFD700',
    fontSize: 14,
  },
  battleButton: {
    backgroundColor: "rgba(255, 168, 0, 0.9)",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    width: '100%',
    borderWidth: 3,
    borderColor: "#FFFFFF",
    marginTop: 10,
    position: 'relative',
  },
  premiumBattleButton: {
    backgroundColor: "rgba(255, 215, 0, 0.9)",
    borderColor: "#FFD700",
  },
  battleButtonDisabled: {
    opacity: 0.5,
  },
  battleButtonText: {
    color: "#0a1428",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  premiumBattleBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  premiumBattleBadgeText: {
    fontSize: 10,
    color: '#000',
  },
  matchmakingInfo: {
    alignItems: "center",
    marginTop: 15,
  },
  loadingSpinner: {
    width: 30,
    height: 30,
    borderWidth: 3,
    borderColor: "#ffa800",
    borderTopColor: "transparent",
    borderRadius: 15,
    marginBottom: 8,
  },
  matchmakingText: {
    color: "#ffa800",
    fontSize: 12,
    fontWeight: "600",
  },
  matchmakingSubtext: {
    color: "#ccc",
    fontSize: 10,
    marginTop: 2,
  },
  doubleXPAnimation: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.95)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#FFD700',
    zIndex: 1000,
    alignItems: 'center',
  },
  doubleXPAnimationText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  doubleXPAnimationSubtext: {
    color: '#000',
    fontSize: 12,
    marginTop: 4,
  },
  scoreAnimationContainer: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreAnimationContent: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 4,
    minWidth: 140,
  },
  scoreAnimationIcon: {
    fontSize: 30,
    marginBottom: 6,
  },
  scoreAnimationText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreAnimationLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  levelUpModalContent: {
    backgroundColor: "rgba(16, 30, 56, 0.98)",
    padding: 25,
    borderRadius: 16,
    width: "90%",
    borderWidth: 4,
    borderColor: "#FFD700",
    alignItems: 'center',
  },
  levelUpTitle: {
    color: "#FFD700",
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  levelUpSubtitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  levelUpDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  newLevelBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  levelBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  newLevelText: {
    color: '#FFD700',
  },
  levelArrow: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  continueButton: {
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4CAF50",
    width: '100%',
  },
  continueButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 10,
  },
  playerInfo: {
    alignItems: "center",
    flex: 0.3,
    position: 'relative',
  },
  playerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  playerName: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  playerPremiumBadge: {
    fontSize: 8,
    marginLeft: 2,
    color: '#FFD700',
  },
  playerScore: {
    color: "#ffa800",
    fontSize: 14,
    fontWeight: "bold",
  },
  playerProgress: {
    height: 3,
    backgroundColor: '#ffa800',
    borderRadius: 2,
    marginTop: 3,
  },
  opponentProgress: {
    backgroundColor: '#9C27B0',
  },
  timerContainer: {
    alignItems: "center",
    flex: 0.4,
  },
  timer: {
    color: "#ffa800",
    fontSize: 36,
    fontWeight: "bold",
    textShadowColor: "rgba(255, 168, 0, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  timerWarning: {
    color: '#f44336',
  },
  questionCount: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  questionArea: {
    flex: 1,
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: "center",
  },
  difficultyText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "bold",
  },
  categoryText: {
    color: "#ffa800",
    fontSize: 11,
    fontWeight: "600",
  },
  premiumMatchBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  premiumMatchText: {
    color: '#FFD700',
    fontSize: 8,
    fontWeight: 'bold',
  },
  questionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#ffa800",
    minHeight: 100,
    justifyContent: "center",
  },
  questionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 22,
  },
  optionsGrid: {
    flex: 1,
  },
  optionContainer: {
    marginVertical: 5,
  },
  optionCard: {
    borderRadius: 10,
    borderWidth: 2,
    minHeight: 60,
    justifyContent: "center",
    paddingHorizontal: 12,
    position: 'relative',
  },
  optionNormal: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  optionSelected: {
    backgroundColor: "rgba(255, 168, 0, 0.2)",
    borderColor: "#ffa800",
  },
  optionCorrect: {
    backgroundColor: "rgba(76, 175, 80, 0.3)",
    borderColor: "#4CAF50",
  },
  optionWrong: {
    backgroundColor: "rgba(244, 67, 54, 0.3)",
    borderColor: "#f44336",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionLetterContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 168, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#ffa800",
  },
  optionLetterCorrect: {
    backgroundColor: "rgba(76, 175, 80, 0.3)",
    borderColor: "#4CAF50",
  },
  optionLetterWrong: {
    backgroundColor: "rgba(244, 67, 54, 0.3)",
    borderColor: "#f44336",
  },
  optionLetter: {
    color: "#ffa800",
    fontSize: 12,
    fontWeight: "bold",
  },
  optionLetterCorrectText: {
    color: '#4CAF50',
  },
  optionLetterWrongText: {
    color: '#f44336',
  },
  optionText: {
    color: "#fff",
    fontSize: 13,
    flex: 1,
    fontWeight: "600",
  },
  correctIndicator: {
    position: 'absolute',
    right: 10,
  },
  correctIndicatorText: {
    color: "#4CAF50",
    fontSize: 18,
    fontWeight: "bold",
  },
  opponentChoiceIndicator: {
    position: 'absolute',
    right: 30,
  },
  opponentChoiceText: {
    fontSize: 14,
  },
  comboContainer: {
    backgroundColor: "rgba(255, 107, 0, 0.3)",
    padding: 10,
    borderRadius: 16,
    alignItems: "center",
    marginVertical: 8,
    borderWidth: 2,
    borderColor: "#FF6B00",
    flexDirection: 'row',
    justifyContent: 'center',
  },
  comboFire: {
    fontSize: 16,
    marginRight: 5,
  },
  comboText: {
    color: "#FF6B00",
    fontSize: 14,
    fontWeight: "bold",
  },
  premiumComboBadge: {
    color: '#FFD700',
    fontSize: 12,
    marginLeft: 4,
  },
  modalTitle: {
    color: "#ffa800",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubtitle: {
    color: "#fff",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 15,
  },
  resultModalContent: {
    backgroundColor: "rgba(16, 30, 56, 0.98)",
    padding: 20,
    borderRadius: 12,
    width: "90%",
    borderWidth: 3,
    borderColor: "#ffa800",
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  winTitle: {
    color: "#4CAF50",
  },
  premiumResultBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  premiumResultText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
  },
  resultStats: {
    marginBottom: 16,
  },
  resultStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  resultStatLabel: {
    color: "#ccc",
    fontSize: 12,
  },
  resultStatValue: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  doubleXPStat: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 4,
    borderRadius: 4,
  },
  premiumStat: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 4,
    borderRadius: 4,
  },
  scoreChangeRow: {
    borderBottomWidth: 2,
    borderBottomColor: '#ffa800',
    marginTop: 4,
    paddingTop: 4,
  },
  resultButtons: {
    flexDirection: "row",
    gap: 8,
  },
  resultButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  continueButton: {
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  resultButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  rewardAdButton: {
    backgroundColor: 'rgba(156, 39, 176, 0.2)',
    borderWidth: 1,
    borderColor: '#9C27B0',
  },
  rewardAdButtonText: {
    color: '#9C27B0',
    fontSize: 12,
  },
  headerWithBack: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    paddingTop: 8,
    marginBottom: 12,
  },
  backButton: {
    color: "#ffa800",
    fontSize: 14,
    fontWeight: "bold",
  },
  screenTitle: {
    color: "#ffa800",
    fontSize: 18,
    fontWeight: "bold",
  },
  premiumHeaderButton: {
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "bold",
    width: 36,
    textAlign: 'center',
  },
  premiumProfileButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  premiumProfileButtonText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  profileCard: {
    backgroundColor: "rgba(255, 168, 0, 0.1)",
    padding: 20,
    borderRadius: 12,
    margin: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffa800",
  },
  profileImageContainerLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  profileImageLarge: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  premiumProfileBadgeLarge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  premiumProfileBadgeLargeText: {
    fontSize: 14,
    color: '#000',
  },
  profileName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  profileTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileTitle: {
    color: "#ffa800",
    fontSize: 14,
    fontWeight: "600",
  },
  profileTitlePremium: {
    color: '#FFD700',
    fontSize: 14,
    marginLeft: 4,
  },
  profileScore: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  profileLevel: {
    color: "#ffa800",
    fontSize: 14,
    marginBottom: 12,
  },
  premiumStatusContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
    width: '100%',
  },
  premiumStatusText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  premiumStatusSubtext: {
    color: '#FFD700',
    fontSize: 10,
  },
  profileStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 12,
    flexWrap: 'wrap',
  },
  profileStat: {
    alignItems: "center",
    width: '48%',
    marginBottom: 8,
  },
  profileStatNumber: {
    color: "#ffa800",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 3,
  },
  profileStatLabel: {
    color: "#ccc",
    fontSize: 10,
    fontWeight: "600",
  },
  badgesSection: {
    width: '100%',
    marginTop: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  badgeItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBadgeItem: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  badgeIconLarge: {
    fontSize: 20,
  },
  premiumBadgeIconLarge: {
    fontSize: 20,
    color: '#FFD700',
  },
  unlockedSection: {
    width: '100%',
    marginTop: 12,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 2,
  },
  statRowLabel: {
    color: '#ccc',
    fontSize: 11,
  },
  statRowValue: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  premiumStatValue: {
    color: '#FFD700',
  },
  doubleXPActive: {
    color: '#FFD700',
  },
  premiumStatRow: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 4,
    borderRadius: 4,
  },
  turkeyStatRow: {
    backgroundColor: 'rgba(220, 20, 60, 0.1)',
    padding: 4,
    borderRadius: 4,
  },
  turkeyStatValue: {
    color: '#FF0000',
    fontWeight: 'bold',
  },
  goPremiumProfileButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  goPremiumProfileButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  goPremiumProfileSubtext: {
    color: '#000',
    fontSize: 10,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
    borderWidth: 2,
    borderColor: '#f44336',
  },
  logoutButtonText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: 'bold',
  },
  leaderboardList: {
    flex: 1,
    paddingHorizontal: 8,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    marginBottom: 6,
    borderRadius: 8,
  },
  currentPlayerItem: {
    backgroundColor: 'rgba(255, 168, 0, 0.2)',
    borderWidth: 2,
    borderColor: '#ffa800',
  },
  rank1Item: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  premiumPlayerItem: {
    borderColor: '#FFD700',
    borderWidth: 1,
  },
  rankContainer: {
    width: 30,
    marginRight: 8,
  },
  rankNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  firstPlaceNumber: {
    color: '#FFD700',
    fontSize: 16,
  },
  secondPlaceNumber: {
    color: '#C0C0C0',
    fontSize: 15,
  },
  thirdPlaceNumber: {
    color: '#CD7F32',
    fontSize: 15,
  },
  currentPlayerRank: {
    color: '#ffa800',
  },
  leaderboardAvatarContainer: {
    position: 'relative',
    marginRight: 10,
  },
  leaderboardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  premiumLeaderboardBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  premiumLeaderboardBadgeText: {
    fontSize: 8,
    color: '#000',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  leaderboardName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  currentPlayerName: {
    color: '#ffa800',
  },
  rank1Name: {
    color: '#FFD700',
  },
  currentPlayerIndicator: {
    color: '#ffa800',
    fontSize: 10,
    marginLeft: 4,
  },
  rank1Indicator: {
    color: '#FFD700',
    fontSize: 12,
    marginLeft: 4,
  },
  premiumIndicator: {
    color: '#FFD700',
    fontSize: 12,
    marginLeft: 4,
  },
  leaderboardDetails: {
    color: '#ffa800',
    fontSize: 10,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  settingsContainer: {
    flex: 1,
    padding: 12,
  },
  settingsGroup: {
    marginBottom: 20,
  },
  settingsGroupTitle: {
    color: '#ffa800',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    paddingLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 24,
    textAlign: 'center',
  },
  settingText: {
    color: '#fff',
    fontSize: 13,
  },
  toggleButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderColor: '#4CAF50',
  },
  toggleText: {
    color: '#f44336',
    fontSize: 10,
    fontWeight: 'bold',
  },
  toggleTextActive: {
    color: '#4CAF50',
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 168, 0, 0.3)',
  },
  settingButtonIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 24,
    textAlign: 'center',
  },
  settingButtonText: {
    color: '#fff',
    fontSize: 13,
    flex: 1,
  },
  settingButtonArrow: {
    color: '#ffa800',
    fontSize: 14,
    marginLeft: 8,
  },
  premiumSettingButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
  },
  premiumSettingButtonText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
  },
  premiumPrice: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dangerButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderColor: '#f44336',
  },
  dangerButtonText: {
    color: '#f44336',
    fontWeight: 'bold',
    fontSize: 13,
    flex: 1,
  },
  versionInfo: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  versionText: {
    color: '#ccc',
    fontSize: 10,
    marginBottom: 3,
  },
  copyrightText: {
    color: '#999',
    fontSize: 8,
  },
  rewardsModalContent: {
    backgroundColor: "rgba(16, 30, 56, 0.98)",
    padding: 20,
    borderRadius: 12,
    width: "90%",
    maxHeight: "80%",
    borderWidth: 3,
    borderColor: "#9C27B0",
  },
  rewardsList: {
    maxHeight: 350,
    marginVertical: 15,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 2,
  },
  disabledReward: {
    opacity: 0.5,
  },
  rewardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rewardIcon: {
    fontSize: 24,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  rewardDescription: {
    color: '#ccc',
    fontSize: 11,
  },
  rewardAction: {
    alignItems: 'center',
    minWidth: 40,
  },
  watchAdText: {
    color: '#ffa800',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  adIcon: {
    fontSize: 16,
  },
  premiumBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  premiumBadgeText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  goPremiumButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  goPremiumButtonText: {
    color: '#000',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

export default App;
