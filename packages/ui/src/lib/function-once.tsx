import { ScriptOnce } from '@tanstack/react-router'

export function FunctionOnce<T = unknown>({ children, param }: { children: (param: T) => unknown, param?: T }) {
  return (
    <ScriptOnce>
      {`(${children.toString()})(${JSON.stringify(param)})`}
    </ScriptOnce>
  )
}
