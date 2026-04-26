<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from "vue";
import { useAudio } from "./composables/useAudio";
import { initThreeScene } from "./composables/useThreeScene";

const dialedNumber = ref("");
const isPlaying = ref(false);
const isError = ref(false);
const ledMessage = ref("NO DISC");
const activeKey = ref<string | null>(null);
const targetNumber = "1984";
const trackUrl = `${import.meta.env.BASE_URL}track.mp3`;

const canvasRef = useTemplateRef<HTMLCanvasElement>("canvasRef");
const { playTone, playMusic, stopMusic } = useAudio();

let pressTimeout: ReturnType<typeof setTimeout> | undefined;

const flashKey = (key: string) => {
  activeKey.value = key;
  clearTimeout(pressTimeout);
  pressTimeout = setTimeout(() => (activeKey.value = null), 100);
};

const pressKey = (key: string) => {
  if (isPlaying.value) return;
  if (dialedNumber.value.length < 4) {
    dialedNumber.value += key;
    flashKey(key);
    playTone(key);
  }
};

const clearNumber = () => {
  flashKey("clr");
  dialedNumber.value = "";
};

const makeCall = () => {
  if (isPlaying.value) return;
  flashKey("call");

  if (dialedNumber.value === targetNumber) {
    isPlaying.value = true;
    isError.value = false;
    ledMessage.value = "TRACK 01";
    void playMusic(trackUrl);
  } else {
    isError.value = true;
    ledMessage.value = "ERR NUM";
    setTimeout(() => {
      isError.value = false;
      if (!isPlaying.value) ledMessage.value = "NO DISC";
      dialedNumber.value = "";
    }, 2000);
  }
};

const endCall = () => {
  flashKey("end");
  isPlaying.value = false;
  ledMessage.value = "NO DISC";
  dialedNumber.value = "";
  stopMusic();
};

onMounted(() => {
  if (canvasRef.value) {
    initThreeScene(canvasRef.value, isPlaying);
  }
});
</script>

<template>
  <div class="app-container">
    <!-- CD PLAYER SECTION -->
    <div class="panel cd-panel">
      <canvas ref="canvasRef" class="three-canvas" />

      <div class="led-overlay" :class="{ error: isError }">
        {{ ledMessage }}
      </div>

      <div class="swipe-indicator">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
        Swipe up to dial
      </div>
    </div>

    <!-- DIALER SECTION -->
    <div class="panel dialer-panel">
      <div class="dialer-display">
        {{ dialedNumber || "" }}
        <span v-if="!isPlaying" class="cursor" />
      </div>

      <svg class="svg-dialer" viewBox="0 0 320 480">
        <defs>
          <linearGradient id="metalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: #4a4a4f; stop-opacity: 1" />
            <stop offset="50%" style="stop-color: #2a2a2d; stop-opacity: 1" />
            <stop offset="100%" style="stop-color: #1a1a1d; stop-opacity: 1" />
          </linearGradient>
        </defs>

        <!-- Number keys -->
        <g
          v-for="key in [
            { k: '1', cx: 80, cy: 60, label: '1' },
            { k: '2', cx: 160, cy: 60, label: '2' },
            { k: '3', cx: 240, cy: 60, label: '3' },
            { k: '4', cx: 80, cy: 150, label: '4' },
            { k: '5', cx: 160, cy: 150, label: '5' },
            { k: '6', cx: 240, cy: 150, label: '6' },
            { k: '7', cx: 80, cy: 240, label: '7' },
            { k: '8', cx: 160, cy: 240, label: '8' },
            { k: '9', cx: 240, cy: 240, label: '9' },
            { k: '*', cx: 80, cy: 330, label: '★' },
            { k: '0', cx: 160, cy: 330, label: '0' },
            { k: '#', cx: 240, cy: 330, label: '#' },
          ]"
          :key="key.k"
          class="dial-btn"
          :class="{ 'is-pressed': activeKey === key.k }"
          @pointerdown="pressKey(key.k)"
        >
          <circle :cx="key.cx" :cy="key.cy" r="32" />
          <text :x="key.cx" :y="key.cy">{{ key.label }}</text>
        </g>

        <!-- Action Buttons: CLR, END, CALL -->
        <g
          class="action-btn clr-btn"
          :class="{ 'is-pressed': activeKey === 'clr' }"
          @pointerdown="clearNumber()"
        >
          <rect x="30" y="410" width="75" height="40" />
          <text x="67" y="432" text-anchor="middle" dominant-baseline="central">
            CLR
          </text>
        </g>
        <g
          class="action-btn end-btn"
          :class="{ 'is-pressed': activeKey === 'end' }"
          @pointerdown="endCall()"
        >
          <rect x="120" y="410" width="75" height="40" />
          <text
            x="157"
            y="432"
            text-anchor="middle"
            dominant-baseline="central"
          >
            END
          </text>
        </g>
        <g
          class="action-btn call-btn"
          :class="{ 'is-pressed': activeKey === 'call' }"
          @pointerdown="makeCall()"
        >
          <rect x="210" y="410" width="75" height="40" />
          <text
            x="247"
            y="432"
            text-anchor="middle"
            dominant-baseline="central"
          >
            CALL
          </text>
        </g>
      </svg>

      <div class="instruction">Dial 1984 to unlock</div>
    </div>
  </div>
</template>
