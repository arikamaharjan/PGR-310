#include "algorithms/unified_sim.h"
#include <math.h>
#include <stdlib.h>

static CursorParticle cursor_particles[MAX_CURSOR_PARTICLES];
static int next_particle_idx = 0;
static float cursor_buffer[MAX_CURSOR_PARTICLES * CURSOR_PARTICLE_STRIDE];

static FloatingShape shapes[MAX_FLOATING_SHAPES];
static InteractiveSpring springs[MAX_INTERACTIVE_SPRINGS];
static int screen_w, screen_h;
static float shape_buffer[MAX_FLOATING_SHAPES * SHAPE_STRIDE];

static float last_mouseX = -100.0f;
static float last_mouseY = -100.0f;

void unified_sim_init(int width, int height, uint32_t seed) {
    srand(seed);
    
    screen_w = width;
    screen_h = height;

    // Init particles
    for (int i = 0; i < MAX_CURSOR_PARTICLES; i++) {
        cursor_particles[i].life = 0.0f;
    }
    
    // Init shapes
    for (int i = 0; i < MAX_FLOATING_SHAPES; i++) {
        shapes[i].baseX = ((float)rand() / (float)RAND_MAX) * width;
        shapes[i].baseY = ((float)rand() / (float)RAND_MAX) * height;
        shapes[i].phase = ((float)rand() / (float)RAND_MAX) * 6.28f;
        shapes[i].speed = 0.5f + ((float)rand() / (float)RAND_MAX) * 1.5f;
        shapes[i].hue = 220.0f + ((float)rand() / (float)RAND_MAX) * 80.0f;
        shapes[i].scale = 0.8f + ((float)rand() / (float)RAND_MAX) * 0.4f;
        shapes[i].offsetX = 0.0f;
        shapes[i].offsetY = 0.0f;
    }

    // Init springs
    for (int i = 0; i < MAX_INTERACTIVE_SPRINGS; i++) {
        springs[i].x_current = 0.0f;
        springs[i].x_target = 0.0f;
        springs[i].x_velocity = 0.0f;
        springs[i].y_current = 0.0f;
        springs[i].y_target = 0.0f;
        springs[i].y_velocity = 0.0f;
    }
}

void unified_sim_step(float dt, float time, float mouseX, float mouseY, int cw, int ch) {
    // 1. Cursor Particles
    float dx = mouseX - last_mouseX;
    float dy = mouseY - last_mouseY;
    float dist = sqrtf(dx*dx + dy*dy);
    
    // Spawn new particles if moving
    if (dist > 2.0f) {
        int count = (int)(dist / 8.0f) + 1;
        if (count > 3) count = 3;
        
        for (int i = 0; i < count; i++) {
            CursorParticle *p = &cursor_particles[next_particle_idx];
            p->x = mouseX + (anim_noise1(time + i) - 0.5f) * 10.0f;
            p->y = mouseY + (anim_noise1(time * 1.1f + i) - 0.5f) * 10.0f;
            p->vx = dx * 0.05f + (anim_noise1(time * 0.9f + i) - 0.5f) * 2.0f;
            p->vy = dy * 0.05f + (anim_noise1(time * 1.2f + i) - 0.5f) * 2.0f;
            p->life = 1.0f;
            p->size = 4.0f + anim_noise1(time * 2.0f) * 4.0f;
            p->hue = 240.0f + anim_noise1(time * 0.5f) * 60.0f;
            
            next_particle_idx = (next_particle_idx + 1) % MAX_CURSOR_PARTICLES;
        }
    }
    
    last_mouseX = mouseX;
    last_mouseY = mouseY;
    
    // Update existing particles
    for (int i = 0; i < MAX_CURSOR_PARTICLES; i++) {
        CursorParticle *p = &cursor_particles[i];
        if (p->life <= 0.0f) continue;
        
        p->life -= dt * 1.5f; 
        if (p->life < 0.0f) p->life = 0.0f;
        
        p->x += p->vx;
        p->y += p->vy;
        p->vx *= 0.96f;
        p->vy *= 0.96f;
        p->vy += 0.05f; 
        
        int b = i * CURSOR_PARTICLE_STRIDE;
        cursor_buffer[b] = p->x;
        cursor_buffer[b+1] = p->y;
        cursor_buffer[b+4] = p->life;
        cursor_buffer[b+5] = p->size;
        cursor_buffer[b+6] = p->hue;
    }
    
    // 2. Floating Shapes Physics
    for (int i = 0; i < MAX_FLOATING_SHAPES; i++) {
        FloatingShape *s = &shapes[i];
        s->x = s->baseX + sinf(time * s->speed + s->phase) * 30.0f;
        s->y = s->baseY + cosf(time * s->speed * 0.8f + s->phase) * 30.0f;
        
        float sdx = s->x + s->offsetX - mouseX;
        float sdy = s->y + s->offsetY - mouseY;
        float sdist = sqrtf(sdx*sdx + sdy*sdy);
        float maxDist = 300.0f;
        
        if (sdist < maxDist) {
            float force = (1.0f - sdist / maxDist) * 60.0f;
            float nx = sdx / (sdist + 0.001f);
            float ny = sdy / (sdist + 0.001f);
            s->offsetX += (nx * force - s->offsetX) * 0.1f;
            s->offsetY += (ny * force - s->offsetY) * 0.1f;
        } else {
            s->offsetX *= 0.95f;
            s->offsetY *= 0.95f;
        }
        
        int b = i * SHAPE_STRIDE;
        shape_buffer[b] = s->x + s->offsetX;
        shape_buffer[b+1] = s->y + s->offsetY;
        shape_buffer[b+2] = s->hue;
        shape_buffer[b+3] = s->scale;
    }

    // 3. Interactive Springs Physics
    for (int i = 0; i < MAX_INTERACTIVE_SPRINGS; i++) {
        InteractiveSpring *s = &springs[i];
        
        // Use existing anim_spring logic (stiffness 150, damping 12)
        s->x_velocity = anim_spring_velocity(s->x_current, s->x_target, s->x_velocity, 150.0f, 12.0f, dt);
        s->x_current += s->x_velocity * dt;
        
        s->y_velocity = anim_spring_velocity(s->y_current, s->y_target, s->y_velocity, 150.0f, 12.0f, dt);
        s->y_current += s->y_velocity * dt;
    }
}

int unified_sim_get_cursor_count() { return MAX_CURSOR_PARTICLES; }
int unified_sim_get_cursor_stride() { return CURSOR_PARTICLE_STRIDE; }
float* unified_sim_get_cursor_ptr() { return cursor_buffer; }

int unified_sim_get_shape_count() { return MAX_FLOATING_SHAPES; }
int unified_sim_get_shape_stride() { return SHAPE_STRIDE; }
float* unified_sim_get_shape_ptr() { return shape_buffer; }

int unified_sim_get_spring_count() { return MAX_INTERACTIVE_SPRINGS; }
int unified_sim_get_spring_stride() { return sizeof(InteractiveSpring) / sizeof(float); }
float* unified_sim_get_spring_ptr() { return (float*)springs; }

void unified_sim_trigger_spring(int index, float vx, float vy) {
    if (index < 0 || index >= MAX_INTERACTIVE_SPRINGS) return;
    springs[index].x_velocity += vx;
    springs[index].y_velocity += vy;
}
