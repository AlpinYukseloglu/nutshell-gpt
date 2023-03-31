import { BeakerIcon } from '@primer/octicons-react'
import { useState } from 'preact/hooks'
import { TriggerMode } from '../config'
import ChatGPTQuery, { QueryStatus } from './ChatGPTQuery'

interface Props {
  question: string
  promptSource: string
  triggerMode: TriggerMode
  onStatusChange?: (status: QueryStatus) => void
}

function ChatGPTCard(props: Props) {
  const [triggered, setTriggered] = useState(false)
  const [color, setColor] = useState<string>('#555')

  const handleMouseEnter = () => {
    setColor('#b6b8ba')
  }

  const handleMouseLeave = () => {
    setColor('#555')
  }

  if (props.triggerMode === TriggerMode.Always) {
    return <ChatGPTQuery {...props} />
  }
  if (triggered) {
    return <ChatGPTQuery {...props} />
  }
  // Original gray: #b6b8ba
  return (
    <p
      className="icon-and-text cursor-pointer"
      style={{ color: color }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => setTriggered(true)}
    >
      <BeakerIcon size={12} /> Summarize changes
    </p>
  )
}

export default ChatGPTCard
