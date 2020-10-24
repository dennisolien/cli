// Copyright 2020 Dennis Lien. All rights reserved. MIT license.

import { parse, logger } from './deps.ts';

import * as bsFs from './fs.js';
import { mainHelp, invalidCommand } from './help.ts';

const { args, env} = Deno;

const inputArgs = parse(args);

function getPropsFromFlags(flags) {
  const checkGlobal = (flags) => !!(flags.g || flags.global);
  const checkHelp = (flags) => !!(flags.h || flags.help);

  const getAlias = (flags) => flags.a || flags.alias || null;
  const getName = (flags) => flags.name || flags.n || null;
  const getOrgCommand = (flags) => flags.command || flags.c || null;
  const getScripts = (flags) => flags.s || flags.script || null;

  return {
    isGlobal: checkGlobal(flags),
    isHelp: checkHelp(flags),
    alias: getAlias(flags),
    name: getName(flags),
    command: getOrgCommand(flags),
    scripts: getScripts(flags),
  };
}

const commands = {
  create: {
    alias: {
      exec: async ({ isGlobal, command, name, isHelp}) => {
        const aliasDir = isGlobal ? bsFs.paths.alias.globals : await bsFs.getProjectDir(bsFs.paths.alias.project);

        if (!name || !command) {
          const errStr = 'Missing required args: name (--name || -n) and command (--command || -c) is required';
          console.log(invalidCommand(errStr));
          return console.log(mainHelp);
        }

        await bsFs.ensureBs();

        const { aliasPath, aliasString } = await bsFs.createAliasFile(
          aliasDir, name, command
        );
        const aliasMainPath = await bsFs.upsertFolderMain(aliasDir)
        const sourceString = bsFs.toSourceString(aliasMainPath);

        if (isGlobal) {
          console.log(`Add this to your bash_profile: ${sourceString}`);
          return console.log(bsFs.toSourceString(bsFs.bashProfilePath));
        }

        return console.log(sourceString);
      },
      help: (flags) => {
        logger.info(mainHelp)
      },
    },
    project: {
      exec: async (flags) => {
        const projectPath = await bsFs.getProjectDir(bsFs.paths.bin.project);
        return logger.info(`Project folder at: ${projectPath}`);
      },
    },
    script: {
      exec: async ({ name }) => {
        if (!name) {
          return logger.error('Name (--name, -n), is required');
        }
        const projectPath = await bsFs.getProjectDir(bsFs.paths.bin.project);
        return bsFs.createScript(name, projectPath);
      },
    },
  },
  load: {
    alias: {
      exec: async ({ isGlobal }) => {
        const aliasDir = isGlobal ? bsFs.paths.alias.globals : await bsFs.getProjectDir(bsFs.paths.alias.project);
        const mainPath = bsFs.paths.alias.main(aliasDir);
        if (isGlobal) {
          return console.log(bsFs.toSourceString(bsFs.bashProfilePath));
        }
        return console.log(bsFs.toSourceString(mainPath)); 
      },
    }
  },
  open: {
    project: {
      exec: async (flags) => {
        const projectPath = await bsFs.getProjectDir(bsFs.paths.bin.project);
        const openInCode = Deno.run({
          cmd: ['code', projectPath],
        });
        await openInCode.status();
        return logger.info(`Project folder at: ${projectPath}`);
      },
    },
  },
  ls: {
    exec: async ({ alias, isGlobal, scripts }) => {
      const aliasesFileNames = [];
      const scriptsFileNames = [];
      const result = {};

      const aliasDir = isGlobal ? bsFs.paths.alias.globals : await bsFs.getProjectDir(bsFs.paths.alias.project);
      const scriptDir = isGlobal ? bsFs.paths.bin.globals : await bsFs.getProjectDir(bsFs.paths.bin.project);

      const getScriptsAndAliases = (!alias && !scripts);
      if (getScriptsAndAliases || scripts) {
        const scriptsNames = await bsFs.getFileNames(scriptDir, false);
        scriptsFileNames.push(...scriptsNames);
        Object.assign(result, {
          scripts: scriptsFileNames,
        });
      }
      if (getScriptsAndAliases || alias) {
        // Map to remove the file type, user do not need to know, they are exec with out.
        const aliasesNames = (await bsFs.getFileNames(aliasDir, false)).map((item) => item.split('.')[0]);
        aliasesFileNames.push(...aliasesNames);
        Object.assign(result, {
          aliases: aliasesFileNames,
        });
      }
      
      return console.log(JSON.stringify(result, null, 2))
    },
  },
  run: {
    exec: async (params, flags) => {
      const projectPath = await bsFs.getProjectDir(bsFs.paths.bin.project);
      const filePath = await bsFs.getScriptPath(params[0], projectPath);

      if (!filePath) {
        return logger.error(`Script: ${params[0]} does not exist in: ${projectPath}`);
      }

      const runScript = Deno.run({
        cmd: ['bash', filePath],
        stdout: "piped",
        stderr: "piped",
      });
      const { code } = await runScript.status();
      if (code === 0) {
        const rawOutput = await runScript.output();
        const result = new TextDecoder().decode(rawOutput);
        return console.info(result);
      } else {
        const rawError = await runScript.stderrOutput();
        const errorString = new TextDecoder().decode(rawError);
        logger.error(errorString);
        throw new Error('Unable to run script, error above.');
      }

    },
  },
};

function giveHelp(params, { isHelp: needHelp }) {
  return console.log(mainHelp);
}


function runner(input) {
  const { _, ...rest } = input;
  const props = getPropsFromFlags(rest);
  if (props.isHelp) {
    return giveHelp(_, props);
  }
  if (_[0] === 'r' || _[0] === 'run') {
    const params = [..._].slice(1);
    return commands.run.exec(params, rest);
  }
  const func = _.reduce((result, name) => {
   if (!result[name]) {
     // TODO: return help
     throw new Error('Not a command');
   } 
   return result[name];
  }, commands);
  if (typeof func.exec !== 'function') {
    // TODO: return help
    return logger.info('Missing props');
  }

  return func.exec(props);
}

runner(inputArgs);