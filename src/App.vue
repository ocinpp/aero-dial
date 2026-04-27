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
  if (isPlaying.value && dialedNumber.value.length === 0) return;
  if (dialedNumber.value.length === 0) return;

  flashKey("call");

  if (dialedNumber.value === targetNumber) {
    isPlaying.value = true;
    isError.value = false;
    ledMessage.value = "TRACK 01";
    dialedNumber.value = "";
    void playMusic(trackUrl);
  } else {
    isError.value = true;
    ledMessage.value = "ERR NUM";
    setTimeout(() => {
      isError.value = false;
      if (!isPlaying.value) ledMessage.value = "NO DISC";
      else ledMessage.value = "TRACK 01";
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

    <!-- DIALER SECTION (SONY CMT STYLE) -->
    <div class="panel dialer-panel">
      <div class="dialer-chassis">
        <div class="vfd-bezel">
          <div class="vfd-display" :class="{ error: isError }">
            <template v-if="isError || dialedNumber.length === 0">
              <div class="lcd-status">{{ ledMessage }}</div>
            </template>
            <template v-else>
              <div class="lcd-numbers">
                {{ dialedNumber }}<span class="cursor" />
              </div>
            </template>
          </div>
        </div>

        <div class="numpad-grid">
          <button
            v-for="key in [
              { k: '1', label: '1' },
              { k: '2', label: '2' },
              { k: '3', label: '3' },
              { k: '4', label: '4' },
              { k: '5', label: '5' },
              { k: '6', label: '6' },
              { k: '7', label: '7' },
              { k: '8', label: '8' },
              { k: '9', label: '9' },
              { k: '*', label: '★' },
              { k: '0', label: '0' },
              { k: '#', label: '#' },
            ]"
            :key="key.k"
            class="metal-btn"
            :class="{ 'is-pressed': activeKey === key.k }"
            @pointerdown="pressKey(key.k)"
          >
            <span class="btn-label">{{ key.label }}</span>
          </button>
        </div>

        <div class="action-row">
          <button
            class="action-btn clr-btn"
            :class="{ 'is-pressed': activeKey === 'clr' }"
            @pointerdown="clearNumber()"
          >
            CLR
          </button>
          <button
            class="action-btn end-btn"
            :class="{ 'is-pressed': activeKey === 'end' }"
            @pointerdown="endCall()"
          >
            END
          </button>
          <button
            class="action-btn call-btn"
            :class="{ 'is-pressed': activeKey === 'call' }"
            @pointerdown="makeCall()"
          >
            CALL
          </button>
        </div>

        <div class="instruction">DIRECT TRACK ACCESS</div>
      </div>
    </div>
  </div>
</template>
