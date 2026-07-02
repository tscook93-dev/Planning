// Lanes are indexed 0 (left), 1 (center), 2 (right)
export const LANE_COUNT = 3

// World-space distances (in "meters ahead of player")
export const SPAWN_Z = 46
export const COLLIDE_Z = 1.6
export const DESPAWN_Z = -4

// Perspective projection
export const HORIZON_Y_FRAC = 0.32
export const BASELINE_Y_FRAC = 0.86
export const PERSPECTIVE_POWER = 1.85
export const MIN_ROAD_WIDTH_FRAC = 0.05
export const MAX_ROAD_WIDTH_FRAC = 0.98
export const MIN_SPRITE_SCALE = 0.1
export const MAX_SPRITE_SCALE = 1

// Speed & difficulty
export const BASE_SPEED = 12.5
export const SPEED_ACCEL_PER_SEC = 0.11
export const MAX_SPEED_ADD = 24
export const SCORE_PER_METER = 8

// Player physics
export const LANE_CHANGE_SPEED = 11 // lerp rate towards target lane
export const JUMP_VELOCITY = 8.6
export const GRAVITY = 24
export const SLIDE_DURATION = 0.62
export const RUN_BOB_FREQ = 9

// Spawning
export const MIN_SPAWN_GAP = 13
export const MAX_SPAWN_GAP = 20

// Input
export const SWIPE_MIN_DISTANCE = 28

// Storage keys
export const HIGH_SCORE_KEY = 'sewer-surfer-highscore'
export const MUTE_KEY = 'sewer-surfer-muted'
