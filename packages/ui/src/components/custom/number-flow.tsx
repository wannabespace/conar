import NumberFlowPrimitive from '@number-flow/react'
import type { ComponentProps } from 'react'

export { NumberFlowGroup } from '@number-flow/react'

const TRANSFORM_TIMING = {
  duration: 450,
  // number-flow's default spring curve at half its 900ms default duration
  easing:
    'linear(0,.005,.019,.039,.066,.096,.129,.165,.202,.24,.278,.316,.354,.39,.426,.461,.494,.526,.557,.586,.614,.64,.665,.689,.711,.731,.751,.769,.786,.802,.817,.831,.844,.856,.867,.877,.887,.896,.904,.912,.919,.925,.931,.937,.942,.947,.951,.955,.959,.962,.965,.968,.971,.973,.976,.978,.98,.981,.983,.984,.986,.987,.988,.989,.99,.991,.992,.992,.993,.994,.994,.995,.995,.996,.996,.9963,.9967,.9969,.9972,.9975,.9977,.9979,.9981,.9982,.9984,.9985,.9987,.9988,.9989,1)',
} as const

const OPACITY_TIMING = { duration: 225, easing: 'ease-out' } as const

export const NumberFlow = (
  props: ComponentProps<typeof NumberFlowPrimitive>
) => (
  <NumberFlowPrimitive
    opacityTiming={OPACITY_TIMING}
    transformTiming={TRANSFORM_TIMING}
    {...props}
  />
)
