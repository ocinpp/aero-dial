export const AUDIO_CONFIG = {
  // Set to true to loop the track indefinitely
  // Set to false to stop playback when the track ends
  loopTrack: true,

  // Map passcodes to specific audio tracks and display titles
  passcodes: {
    "1984": {
      url: `${import.meta.env.BASE_URL}track1.mp3`,
      title: "TRACK 01"
    },
    "0078": {
      url: `${import.meta.env.BASE_URL}track2.mp3`,
      title: "TRACK 02"
    },
    "0123": {
      url: `${import.meta.env.BASE_URL}track8.mp3`,
      title: "TRACK 03"
    },
    "0100": {
      url: `${import.meta.env.BASE_URL}track18.mp3`,
      title: "TRACK 04"
    },
    "0087": {
      url: `${import.meta.env.BASE_URL}track27.mp3`,
      title: "TRACK 05"
    },
    "0093": {
      url: `${import.meta.env.BASE_URL}track0.mp3`,
      title: "TRACK 06"
    },
    // You can add more passcodes and tracks here, e.g.:
    // "2024": {
    //   url: `${import.meta.env.BASE_URL}track2.mp3`,
    //   title: "TRACK 02"
    // }
  } as Record<string, { url: string, title: string }>
};
