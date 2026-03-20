import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ReactNode } from 'react'

import { CartesianGrid, LineChart, XAxis, YAxis } from 'recharts'

type AxisDomain = [number | string, number | string]

type BreezeAxis = {
	yAxisId?: string
	dataKey?: string
	domain?: AxisDomain
	tickFormatter?: (value: number) => string
}

type BreezeLineChartProps<TData extends Record<string, unknown>> = {
	config: ChartConfig
	data: TData[]
	className?: string
	xAxisDataKey: string
	xAxisMinTickGap?: number
	margin?: { top?: number; right?: number; bottom?: number; left?: number }
	leftAxis: BreezeAxis
	rightAxis?: BreezeAxis
	mirrorSingleAxis?: boolean
	tooltipFormatter?: (value: number, name: string, item: unknown) => ReactNode
	tooltipLabelFormatter?: (label: string | number, payload: ReadonlyArray<{ payload?: Record<string, unknown> }>) => ReactNode
	children: ReactNode
}

const BreezeLineChart = <TData extends Record<string, unknown>>({
	config,
	data,
	className,
	xAxisDataKey,
	xAxisMinTickGap = 24,
	margin,
	leftAxis,
	rightAxis,
	mirrorSingleAxis = true,
	tooltipFormatter,
	tooltipLabelFormatter,
	children,
}: BreezeLineChartProps<TData>) => {
	const hasDualAxis = Boolean(rightAxis)
	const showRightAxis = hasDualAxis || mirrorSingleAxis
	const effectiveRightAxis = rightAxis ?? leftAxis
	const mirroredRightAxisId = hasDualAxis ? effectiveRightAxis.yAxisId : '__breeze-right-axis'

	return (
		<ChartContainer
			config={config}
			className={className}
		>
			<LineChart
				data={data}
				margin={margin}
			>
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey={xAxisDataKey}
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					minTickGap={xAxisMinTickGap}
				/>
				<YAxis
					yAxisId={leftAxis.yAxisId}
					dataKey={leftAxis.dataKey}
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					domain={leftAxis.domain}
					tickFormatter={leftAxis.tickFormatter}
				/>
				{showRightAxis ? (
					<YAxis
						yAxisId={mirroredRightAxisId}
						dataKey={effectiveRightAxis.dataKey ?? (!hasDualAxis ? leftAxis.dataKey : undefined)}
						orientation='right'
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						domain={effectiveRightAxis.domain}
						tickFormatter={effectiveRightAxis.tickFormatter}
					/>
				) : null}
				<ChartTooltip
					content={
						<ChartTooltipContent
							formatter={tooltipFormatter ? (value: any, name: any, item: unknown) => tooltipFormatter(Number(value), String(name ?? ''), item) : undefined}
							labelFormatter={
								tooltipLabelFormatter
									? (label: string | number, payload: readonly { payload?: Record<string, unknown> }[]) =>
											tooltipLabelFormatter(label as string | number, (payload as ReadonlyArray<{ payload?: Record<string, unknown> }>) ?? [])
									: undefined
							}
						/>
					}
				/>
				{children}
			</LineChart>
		</ChartContainer>
	)
}

export default BreezeLineChart

