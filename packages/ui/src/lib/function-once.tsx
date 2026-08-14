import { ScriptOnce } from '@tanstack/react-router'

export const FunctionOnce = <T = unknown,>({
  children,
  param,
}: {
  children: (param: T) => unknown
  param?: T
}) => (
  <ScriptOnce>{`(${children.toString()})(${JSON.stringify(param)})`}</ScriptOnce>
)
