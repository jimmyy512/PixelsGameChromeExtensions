export interface SocketMessageMonitorMessage {
  from: string;
  id: string;
  name: string;
  protoInstance: any;
}

export interface SocketMessageMonitorMessageRender
  extends SocketMessageMonitorMessage {
  index: number;
  arrow: string;
  arrowColor: string;
  focused: boolean;
}

export interface SocketMessageMonitor {
  maxLength: number;
  messages: SocketMessageMonitorMessage[];
}

export interface SocketSelectData {
  functionName: string;
  functionResult: any;
  children: SocketSelectData[] | null;
}
