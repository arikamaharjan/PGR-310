#include "algorithms/water_sim.h"
#include "algorithms/anim.h"
#include <math.h>
#include <stdlib.h>

static FishSim fish_sims[MAX_FISH];
static FishData fish_out[MAX_FISH];
static int total_fish = 0;

static BubbleSim bubble_sims[MAX_BUBBLES];
static BubbleData bubble_out[MAX_BUBBLES];
static int total_bubbles = 0;

static float wave_out[WAVE_SAMPLE_COUNT];

void watersim_init(int fishCount, int bubbleCount) {
    total_fish = fishCount > MAX_FISH ? MAX_FISH : fishCount;
    total_bubbles = bubbleCount > MAX_BUBBLES ? MAX_BUBBLES : bubbleCount;

    for (int i = 0; i < total_fish; i++) {
        float speed = 0.3f + ((float)rand() / (float)RAND_MAX) * 1.2f;
        float phase = ((float)rand() / (float)RAND_MAX) * 6.28f;
        int goingRight = (rand() % 2 == 0);
        float x = goingRight ? (-85.0f - ((float)rand() / (float)RAND_MAX) * 40.0f) : (85.0f + ((float)rand() / (float)RAND_MAX) * 40.0f);
        float baseY = -5.0f - ((float)rand() / (float)RAND_MAX) * 55.0f;
        float rot = goingRight ? 0 : 3.14159f;

        fish_sims[i].x = x;
        fish_sims[i].y = baseY;
        fish_sims[i].rot = rot;
        fish_sims[i].baseY = baseY;
        fish_sims[i].speed = speed;
        fish_sims[i].phase = phase;
        fish_sims[i].goingRight = goingRight;

        fish_out[i].x = x;
        fish_out[i].y = baseY;
        fish_out[i].rot = 0;
        fish_out[i].scaleX = goingRight ? 1.0f : -1.0f;
    }

    for (int i = 0; i < total_bubbles; i++) {
        float speed = 0.5f + ((float)rand() / (float)RAND_MAX) * 2.0f;
        float size = 0.4f + ((float)rand() / (float)RAND_MAX) * 1.2f;
        float x = (((float)rand() / (float)RAND_MAX) - 0.5f) * 100.0f;
        float y = -10.0f - ((float)rand() / (float)RAND_MAX) * 50.0f;
        
        bubble_sims[i].x = x;
        bubble_sims[i].y = y;
        bubble_sims[i].startX = x;
        bubble_sims[i].speed = speed;
        bubble_sims[i].size = size;
        bubble_sims[i].phase = ((float)rand() / (float)RAND_MAX) * 6.28f;
        bubble_sims[i].opacity = 0.15f + ((float)rand() / (float)RAND_MAX) * 0.3f;

        bubble_out[i].x = x;
        bubble_out[i].y = y;
        bubble_out[i].size = size;
        bubble_out[i].opacity = bubble_sims[i].opacity;
    }
}

void watersim_step(float dt, float totalTime, float scrollNorm) {  // CHANGED: Added scrollNorm param for dynamic reset
    // 1. Batch Fish Simulation
    for (int i = 0; i < total_fish; i++) {
        FishSim *f = &fish_sims[i];
        
        // Move forward
        float dist = f->speed * dt * 10.0f;
        f->x += cosf(f->rot) * dist;
        
        // Vertical bobbing and undulation via anim_wave
        float bob = anim_wave(totalTime, 0.5f + (i % 5) * 0.1f, 1.5f, f->phase);
        float targetY = f->baseY + anim_wave(totalTime, 0.15f + (i % 7) * 0.02f, 3.0f, f->phase + 1.0f);
        
        // Smooth Y approach
        float dy = targetY - f->y;
        f->y += dy * 0.02f;

        // Wrap
        if (f->goingRight && f->x > 85.0f) {
            f->x = -85.0f;
            f->y = f->baseY + (((float)rand() / (float)RAND_MAX) - 0.5f) * 10.0f;
        } else if (!f->goingRight && f->x < -85.0f) {
            f->x = 85.0f;
            f->y = f->baseY + (((float)rand() / (float)RAND_MAX) - 0.5f) * 10.0f;
        }

        // Write to output buffer
        FishData *out = &fish_out[i];
        out->x = f->x;
        out->y = f->y + bob;
        out->rot = anim_wave(totalTime, 0.8f + (i % 3) * 0.2f, 0.12f, f->phase);
        out->scaleX = f->goingRight ? 1.0f : -1.0f;
    }

    // 2. Batch Bubble Simulation
    float resetY = 40.0f - scrollNorm * 55.0f;  // NEW: Dynamic reset based on scroll (lerp 40 to -15)
    for (int i = 0; i < total_bubbles; i++) {
        BubbleSim *b = &bubble_sims[i];
        b->y += b->speed * dt;
        float wobble = anim_wave(totalTime, 1.5f, 0.5f, b->phase);
        
        if (b->y > resetY) {  // CHANGED: Use dynamic resetY
            b->y = -10.0f - ((float)rand() / (float)RAND_MAX) * 50.0f;
            b->x = (((float)rand() / (float)RAND_MAX) - 0.5f) * 100.0f;
            b->startX = b->x;
        }

        BubbleData *out = &bubble_out[i];
        out->x = b->startX + wobble;
        out->y = b->y;
        out->size = b->size;
        out->opacity = b->opacity;
    }
}

float* watersim_get_fish_buffer(void) {
    return (float*)fish_out;
}

float* watersim_get_bubble_buffer(void) {
    return (float*)bubble_out;
}

float* watersim_get_wave_buffer(float totalTime) {
    for (int i = 0; i < WAVE_SAMPLE_COUNT; i++) {
        float nx = (float)i / (WAVE_SAMPLE_COUNT - 1);
        float freq = 1.2f + nx * 0.8f;
        float amp = 0.8f + (1.0f - nx) * 0.5f;
        float phase = nx * 6.28318f;
        wave_out[i] = anim_wave(totalTime, 6.28318f * freq, amp, phase);
    }
    return wave_out;
}