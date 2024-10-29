// lib/logger.ts

// Codes de couleurs ANSI pour la console
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',
    
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    
    bgBlack: '\x1b[40m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
    bgWhite: '\x1b[47m'
  };
  
  export const logger = {
    success: (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`${colors.green}✔ [${timestamp}] SUCCESS: ${message}${colors.reset}`);
    },
  
    error: (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`${colors.red}✘ [${timestamp}] ERROR: ${message}${colors.reset}`);
    },
  
    info: (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`${colors.cyan}ℹ [${timestamp}] INFO: ${message}${colors.reset}`);
    },
  
    warning: (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`${colors.yellow}⚠ [${timestamp}] WARNING: ${message}${colors.reset}`);
    },
  
    debug: (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`${colors.magenta}🔍 [${timestamp}] DEBUG: ${message}${colors.reset}`);
    },
  
    // Pour les séparateurs et les titres de sections
    section: (title: string) => {
      console.log('\n' + colors.bright + colors.cyan + '='.repeat(50));
      console.log(` ${title} `);
      console.log('='.repeat(50) + colors.reset + '\n');
    },
  
    // Pour les données importantes
    data: (label: string, data: any) => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`${colors.blue}📊 [${timestamp}] ${label}:${colors.reset}`, data);
    },
  
    // Pour les messages de réussite avec emoji
    successCheck: (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`${colors.green}✅ [${timestamp}] ${message}${colors.reset}`);
    },
  
    // Pour les erreurs critiques
    criticalError: (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`${colors.bright}${colors.bgRed}🚨 [${timestamp}] CRITICAL ERROR: ${message}${colors.reset}`);
    }
  };
  
  export default logger;