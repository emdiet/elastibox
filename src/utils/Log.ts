enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  OFF = 4,
}

const LOG_LEVEL = LogLevel.DEBUG;

class Log{

    public static debug(...args: any[]) {
       if (LOG_LEVEL <= LogLevel.DEBUG) {
           console.log(...args);
       }
    }

    public static info(...args: any[]) {
      if (LOG_LEVEL <= LogLevel.INFO) {
        console.info(...args);
      }
    }

    public static warn(...args: any[]) {
      if (LOG_LEVEL <= LogLevel.WARN) {
        console.warn(...args);
      }
    }

    public static error(...args: any[]) {
      if (LOG_LEVEL <= LogLevel.ERROR) {
        console.error(...args);
      }
    }

}
