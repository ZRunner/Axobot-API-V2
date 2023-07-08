declare module "http" {
    interface IncomingMessage {
        _startTime: Date
    }
    interface ServerResponse {
        _err?: string
      }
}
