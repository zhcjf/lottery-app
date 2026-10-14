import type { ComponentType } from 'react'
import type { AnimationProps, AnimationMeta } from './types'
import { ANIMATIONS } from './types'

import RedPacketRain from './RedPacketRain'
import ParticleVortex from './ParticleVortex'
import DealCards from './DealCards'
import GoldenEgg from './GoldenEgg'

export type { AnimationProps, AnimationMeta }
export { ANIMATIONS, DEFAULT_ANIMATION } from './types'
export { RevealView, Confetti, fluidName, ArtName } from './RevealView'
export { CelebrationOverlay } from './CelebrationOverlay'

export const ANIMATION_COMPONENTS: Record<string, ComponentType<AnimationProps>> = {
  'red-packet-rain': RedPacketRain,
  'particle-vortex': ParticleVortex,
  'deal-cards': DealCards,
  'golden-egg': GoldenEgg,
}
