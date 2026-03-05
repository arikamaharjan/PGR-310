#ifndef WATER_SIM_H
#define WATER_SIM_H

#include <stdint.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#define EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define EXPORT
#endif

#define MAX_FISH 256
#define MAX_BUBBLES 128
#define WAVE_SAMPLE_COUNT 16

typedef struct {
    float x, y, rot, scaleX;
} FishData;

typedef struct {
    float x, y, size, opacity;
} BubbleData;

typedef struct {
    float x, y, rot, baseY, speed, phase;
    int goingRight;
} FishSim;

typedef struct {
    float x, y, speed, size, phase, startX, opacity;
} BubbleSim;

EXPORT void watersim_init(int fishCount, int bubbleCount);
EXPORT void watersim_step(float dt, float totalTime, float scrollNorm);
EXPORT float* watersim_get_fish_buffer(void);
EXPORT float* watersim_get_bubble_buffer(void);
EXPORT float* watersim_get_wave_buffer(float totalTime);

#endif
