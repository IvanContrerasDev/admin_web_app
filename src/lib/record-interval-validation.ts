interface IntervalBounds {
  startTime: string | null
  endTime: string | null
  changed: boolean
}

export function hasManualIntervalOverlap(intervals: IntervalBounds[]) {
  const bounded = intervals
    .filter((interval) => interval.startTime && interval.endTime)
    .map((interval) => ({ start: new Date(interval.startTime!).getTime(), end: new Date(interval.endTime!).getTime(), changed: interval.changed }))

  return bounded.some((left, index) => bounded.slice(index + 1).some((right) =>
    (left.changed || right.changed) && left.start < right.end && right.start < left.end))
}
