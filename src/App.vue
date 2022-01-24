<template>
  <main>
    <v-app>
      <v-alert
        class="mycroft-status"
        :type="mycroftStatus.color"
        :icon="mycroftStatus.icon"
        width="200"
        elevation="6"
      >
        {{ mycroftStatus.text }}
        <v-progress-linear v-show="mycroftStatus.busy" indeterminate />
      </v-alert>

      <v-container>
        <v-row>
          <v-col>
            <p class="mb-0">
              Message Bus IP: <span class="font-weight-bold">{{ busIP }}</span>
            </p>
            <p class="mb-0">
              Message Bus Port:
              <span class="font-weight-bold">{{ busPort }}</span>
            </p>
            <p class="mb-0">
              Full Socket Address:
              <span class="font-weight-bold">
                {{ `ws://${busIP}:${busPort}/core` }}
              </span>
            </p>
          </v-col>
        </v-row>

        <v-divider class="my-6" />

        <v-row>
          <v-col>
            <v-card max-width="640">
              <v-card-title> Ask Mycroft to Say Something </v-card-title>

              <v-card-text>
                <v-text-field
                  v-model="speakText"
                  class="speak-input"
                  hide-details
                  clearable
                  label="Text for Mycroft to Say"
                />
              </v-card-text>

              <v-card-actions>
                <v-btn
                  @click="speak()"
                  :disabled="mycroftBusy || !speakText"
                  :loading="mycroftWorking"
                  text
                  rounded
                  color="primary"
                >
                  Speak
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <v-divider class="my-6" />

        <v-row>
          <v-col>
            <v-card max-width="640">
              <v-card-title> Ask Mycroft to Listen </v-card-title>

              <v-card-text>
                <p>Click the button below to have Mycroft start listening.</p>
                <v-btn
                  @click="listen()"
                  :disabled="mycroftBusy"
                  :loading="mycroftWorking"
                  rounded
                  class="mb-6"
                  color="primary"
                >
                  {{ mycroftListening ? "Listening..." : "Hey, Mycroft!" }}
                </v-btn>

                <h4>What Mycroft Heard:</h4>
                <v-sheet rounded color="#f1f1f1" class="pa-2">
                  <h5>{{ utterance || "Nothing recorded yet" }}</h5>
                </v-sheet>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>

      <v-snackbar v-model="snackOptions.show" :color="snackOptions.color">
        {{ snackOptions.message }}
      </v-snackbar>
    </v-app>
  </main>
</template>

<script>
export default {
  name: "Main",

  data() {
    return {
      busIP: process.env.VUE_APP_MYCROFT_BUS_IP,
      busPort: process.env.VUE_APP_MYCROFT_BUS_PORT,
      timeoutDelay: 20000,
      mycroftConnected: false,
      mycroftListening: false,
      mycroftWorking: false,
      mycroftNotFound: false,
      utterance: null,
      socket: null,
      speakText: null,
      snackOptions: {
        show: false,
        message: "",
        color: "primary",
      },
    };
  },

  computed: {
    mycroftStatus() {
      if (this.mycroftNotFound) {
        return {
          icon: "mdi-close-circle",
          text: "Failed to Connect",
          busy: false,
          color: "error",
        };
      }

      if (this.mycroftWorking) {
        return {
          icon: "mdi-head-dots-horizontal-outline",
          text: "Working...",
          busy: true,
          color: "success",
        };
      }

      if (this.mycroftListening) {
        return {
          icon: "mdi-microphone",
          text: "Listening...",
          busy: false,
          color: "success",
        };
      }

      if (this.mycroftConnected) {
        return {
          icon: "mdi-check-circle",
          text: "Mycroft is ready",
          busy: false,
          color: "success",
        };
      }

      return {
        icon: "mdi-transit-connection-horizontal",
        text: "Connecting...",
        busy: true,
        color: null,
      };
    },

    mycroftBusy() {
      return (
        !this.mycroftConnected || this.mycroftListening || this.mycroftWorking
      );
    },
  },

  created() {
    this.socket = new WebSocket(`ws://${this.busIP}:${this.busPort}/core`);
    let $this = this;

    let connectionTimer = setTimeout(() => {
      this.mycroftNotFound = true;
    }, this.timeoutDelay);

    this.socket.onopen = () => {
      this.mycroftConnected = true;
      clearTimeout(connectionTimer);
    };

    this.socket.onmessage = function ({ data }) {
      let response = JSON.parse(data);

      // useful for examining all bus activity to find what you need
      // just uncomment and check the console for all messages coming through
      // console.log(response);

      switch (response.type) {
        case "recognizer_loop:record_begin":
          $this.mycroftListening = true;
          break;
        case "recognizer_loop:record_end":
          $this.mycroftListening = false;
          break;
        case "recognizer_loop:audio_output_start":
        case "mycroft.skill.handler.start":
          $this.mycroftWorking = true;
          break;
        case "recognizer_loop:audio_output_end":
        case "mycroft.skill.handler.complete":
          $this.mycroftWorking = false;
          break;
        case "speak":
          break;
        case "recognizer_loop:wakeword":
          break;
        case "recognizer_loop:utterance":
          $this.utterance = response.data.utterances[0];
          break;
      }
    };
  },

  methods: {
    speak() {
      if (!this.speakText) {
        Object.assign(this.snackOptions, {
          show: true,
          message: "Enter some text, first!",
          color: "error",
        });
        return;
      }

      let message = {
        type: "speak",
        data: {
          utterance: this.speakText,
        },
      };

      this.mycroftWorking = true;
      this.socket.send(JSON.stringify(message));
    },

    listen() {
      let payload = {
        type: "mycroft.mic.listen",
      };

      this.socket.send(JSON.stringify(payload));
    },
  },
};
</script>

<style lang="scss" scoped>
.theme--light.v-application {
  background-color: #f1f1f1;
}

.mycroft-status {
  position: fixed;
  top: 10px;
  right: 10px;
}

.speak-input {
  max-width: 300px;
}
</style>
