import { cn } from '@tamery/ui/lib/utils'
import * as React from 'react'
import type { TooltipValueType } from 'recharts'
import * as RechartsPrimitive from 'recharts'

const THEMES = { dark: '.dark', light: '' } as const

const INITIAL_DIMENSION = { height: 200, width: 320 } as const
type TooltipNameType = number | string

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
>

interface ChartContextProps {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

const useChart = () => {
  const context = React.use(ChartContext)

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />')
  }

  return context
}

const getPayloadConfigFromPayload = (
  config: ChartConfig,
  payload: unknown,
  key: string
) => {
  if (typeof payload !== 'object' || payload === null) {
    return
  }

  const payloadPayload =
    'payload' in payload &&
    typeof payload.payload === 'object' &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === 'string'
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === 'string'
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config ? config[configLabelKey] : config[key]
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, itemConfig]) => itemConfig.theme ?? itemConfig.color
  )

  if (!colorConfig.length) {
    return null
  }

  const styleHtml = Object.entries(THEMES)
    .map(
      ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ??
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join('\n')}
}
`
    )
    .join('\n')

  // oxlint-disable-next-line react/no-danger
  return <style dangerouslySetInnerHTML={{ __html: styleHtml }} />
}

const ChartContainer = ({
  id,
  className,
  children,
  config,
  initialDimension = INITIAL_DIMENSION,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >['children']
  initialDimension?: {
    width: number
    height: number
  }
}) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id ?? uniqueId.replaceAll(':', '')}`
  const contextValue = { config }

  return (
    <ChartContext.Provider value={contextValue}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          `[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden`,
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer
          initialDimension={initialDimension}
        >
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

const formatTooltipValue = (value: unknown) => {
  if (typeof value === 'number') {
    return value.toLocaleString()
  }
  return String(value)
}

const ChartTooltipIndicator = ({
  hideIndicator,
  indicator,
  indicatorColor,
  itemConfig,
  nestLabel,
}: {
  hideIndicator: boolean
  indicator: 'line' | 'dot' | 'dashed'
  indicatorColor?: string
  itemConfig?: { icon?: React.ComponentType }
  nestLabel: boolean
}) => {
  if (itemConfig?.icon) {
    return <itemConfig.icon />
  }
  if (hideIndicator) {
    return null
  }
  return (
    <div
      className={cn(`border-border shrink-0 rounded-xs bg-(--color-bg)`, {
        'my-0.5': nestLabel && indicator === 'dashed',
        'size-2.5': indicator === 'dot',
        'w-0 border-[1.5px] border-dashed bg-transparent':
          indicator === 'dashed',
        'w-1': indicator === 'line',
      })}
      style={
        {
          '--color-bg': indicatorColor,
          '--color-border': indicatorColor,
        } as React.CSSProperties
      }
    />
  )
}

const ChartTooltipItem = ({
  color,
  config,
  formatter,
  hideIndicator,
  index,
  indicator,
  item,
  nameKey,
  nestLabel,
  tooltipLabel,
}: {
  color?: string
  config: ChartConfig
  formatter?: React.ComponentProps<
    typeof RechartsPrimitive.Tooltip
  >['formatter']
  hideIndicator: boolean
  index: number
  indicator: 'line' | 'dot' | 'dashed'
  item: NonNullable<
    RechartsPrimitive.DefaultTooltipContentProps<
      TooltipValueType,
      TooltipNameType
    >['payload']
  >[number]
  nameKey?: string
  nestLabel: boolean
  tooltipLabel: React.ReactNode
}) => {
  const key = `${nameKey ?? item.name ?? item.dataKey ?? 'value'}`
  const itemConfig = getPayloadConfigFromPayload(config, item, key)
  const indicatorColor = color ?? item.payload?.fill ?? item.color

  if (formatter && item?.value !== undefined && item.name) {
    return formatter(item.value, item.name, item, index, item.payload)
  }

  return (
    <>
      <ChartTooltipIndicator
        hideIndicator={hideIndicator}
        indicator={indicator}
        indicatorColor={indicatorColor}
        itemConfig={itemConfig}
        nestLabel={nestLabel}
      />
      <div
        className={cn(
          'flex flex-1 justify-between leading-none',
          nestLabel ? 'items-end' : 'items-center'
        )}
      >
        <div className="grid gap-1.5">
          {nestLabel ? tooltipLabel : null}
          <span className="text-muted-foreground">
            {itemConfig?.label ?? item.name}
          </span>
        </div>
        {item.value !== null && (
          <span className="text-foreground font-mono font-medium tabular-nums">
            {formatTooltipValue(item.value)}
          </span>
        )}
      </div>
    </>
  )
}

type TooltipContentProps = RechartsPrimitive.DefaultTooltipContentProps<
  TooltipValueType,
  TooltipNameType
>

const renderTooltipLabel = ({
  config,
  hideLabel,
  label,
  labelClassName,
  labelFormatter,
  labelKey,
  payload,
}: {
  config: ChartConfig
  hideLabel: boolean
  label: TooltipContentProps['label']
  labelClassName?: string
  labelFormatter?: TooltipContentProps['labelFormatter']
  labelKey?: string
  payload: TooltipContentProps['payload']
}) => {
  if (hideLabel || !payload?.length) {
    return null
  }

  const [item] = payload
  const key = `${labelKey ?? item?.dataKey ?? item?.name ?? 'value'}`
  const itemConfig = getPayloadConfigFromPayload(config, item, key)
  const value =
    !labelKey && typeof label === 'string'
      ? (config[label]?.label ?? label)
      : itemConfig?.label

  if (labelFormatter) {
    return (
      <div className={cn('font-medium', labelClassName)}>
        {labelFormatter(value, payload)}
      </div>
    )
  }

  if (!value) {
    return null
  }

  return <div className={cn('font-medium', labelClassName)}>{value}</div>
}

const ChartTooltipContent = ({
  active,
  payload,
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<'div'> & {
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: 'line' | 'dot' | 'dashed'
    nameKey?: string
    labelKey?: string
  } & Omit<
    RechartsPrimitive.DefaultTooltipContentProps<
      TooltipValueType,
      TooltipNameType
    >,
    'accessibilityLayer'
  >) => {
  const { config } = useChart()

  const tooltipLabel = renderTooltipLabel({
    config,
    hideLabel,
    label,
    labelClassName,
    labelFormatter,
    labelKey,
    payload,
  })

  if (!active || !payload?.length) {
    return null
  }

  const nestLabel = payload.length === 1 && indicator !== 'dot'

  return (
    <div
      className={cn(
        `bg-popover text-popover-foreground ring-foreground/4 grid min-w-32 items-start gap-1.5 rounded-xl px-2.5 py-1.5 text-xs shadow-lg ring-1`,
        className
      )}
    >
      {nestLabel ? null : tooltipLabel}
      <div className="grid gap-1.5">
        {payload
          .filter((item) => item.type !== 'none')
          .map((item, index) => (
            <div
              // oxlint-disable-next-line react/no-array-index-key
              key={index}
              className={cn(
                `[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:size-2.5`,
                indicator === 'dot' && 'items-center'
              )}
            >
              <ChartTooltipItem
                color={color}
                config={config}
                formatter={formatter}
                hideIndicator={hideIndicator}
                index={index}
                indicator={indicator}
                item={item}
                nameKey={nameKey}
                nestLabel={nestLabel}
                tooltipLabel={tooltipLabel}
              />
            </div>
          ))}
      </div>
    </div>
  )
}

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = ({
  className,
  hideIcon = false,
  payload,
  verticalAlign = 'bottom',
  nameKey,
}: React.ComponentProps<'div'> & {
  hideIcon?: boolean
  nameKey?: string
} & RechartsPrimitive.DefaultLegendContentProps) => {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-4',
        verticalAlign === 'top' ? 'pb-3' : 'pt-3',
        className
      )}
    >
      {payload
        .filter((item) => item.type !== 'none')
        .map((item, index) => {
          const key = `${nameKey ?? item.dataKey ?? 'value'}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              // oxlint-disable-next-line react/no-array-index-key
              key={index}
              className={cn(
                `[&>svg]:text-muted-foreground flex items-center gap-1.5 [&>svg]:size-3`
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="size-2 shrink-0 rounded-xs"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
    </div>
  )
}

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
}
