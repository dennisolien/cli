import {
  red,
  green,
  bold,
  dim,
  italic,
  underline,
  inverse,
  hidden,
  strikethrough,
  black,
  yellow,
  blue,
  magenta,
  cyan,
  white,
  gray,
  bgBlack,
  bgRed,
  bgGreen,
  bgYellow,
  bgBlue,
  bgMagenta,
  bgCyan,
  bgWhite,
} from './deps.ts';

const link = (url:string) => cyan(url);
const command = (text:string) => bold(`bs ${text}`);
const commandDescription = (text:string) => dim(text);
const line = dim(`\n ---------------------------------------------------------------- \n`)

export const mainHelp:string = `
  Usage:    ${bold('bs [--version] [--help]')}
            ${bold('<command> [<args>]')}

  You can read the full documentation on ${link('https://github.com/dennisolien/cli')}

  This is some of the most relevant commands:
    ${command('create alias --name[-n] --command[-c] -g(optional)')} ${commandDescription(`Create a new alias, with -g for global scope`)}
    ${command('create alias --name[-n] --command[-c] -g(optional)')} ${commandDescription(`Create a new alias, with -g for global scope`)}
    ${command('load alias -g(optional)')} ${commandDescription(`Get ${underline('source')} to load, with -g for global scope`)}
        Use this to get a source, to load it copy it and past it back to run it, or do: ${underline('eval bs load alias')}, or create an alias for it
    ${command('ls --alias[-a] --script[-s] -g(optional)')} ${commandDescription(`list aliases and or scripts, with -g for global scope`)}
`;

export const invalidCommand = (msg?:string) => `${line}${magenta('Invalid command')}: ${msg ? bold(msg) : ''}${line}`;

export const terminalStyleTest:string = `
  ${red('red')}
  ${green('green')}
  ${bold('bold')}
  ${dim('dim')}
  ${italic('italic')}
  ${underline('underline')}
  ${inverse('inverse')}
  ${hidden('hidden')}
  ${strikethrough('strikethrough')}
  ${black('black')}
  ${yellow('yellow')}
  ${blue('blue')}
  ${magenta('magenta')}
  ${cyan('cyan')}
  ${white('white')}
  ${gray('gray')}
  ${bgBlack('bgBlack')}
  ${bgRed('bgRed')}
  ${bgGreen('bgGreen')}
  ${bgYellow('bgYellow')}
  ${bgBlue('bgBlue')}
  ${bgMagenta('bgMagenta')}
  ${bgCyan('bgCyan')}
  ${bgWhite('bgWhite')}
`;