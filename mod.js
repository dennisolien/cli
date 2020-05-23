// Copyright 2020 Dennis Lien. All rights reserved. MIT license.

const { args, env} = Deno;
import { parse } from 'https://deno.land/std@0.51.0/flags/mod.ts';
import * as logger from 'https://deno.land/std/log/mod.ts';
import * as bsFs from './fs.js';

const inputArgs = parse(args);

const commands = {
  create: {
    alias: {
      exec: async (flags) => {
        const isGlobal = (flags.g || flags.global);
        const originalCommand = flags.org || flags.o;
        const name = flags.name || flags.n;
        const aliasDir = isGlobal ? bsFs.paths.alias.globals : await bsFs.getProjectDir(bsFs.paths.alias.project);

        if (!name || !originalCommand) {
          // TODO: return help
          return logger.error(
            'Name (--name, -n) and "original command" (--org, -o) is required',
          );
        }

        await bsFs.ensureBs();

        const { aliasPath, aliasString } = await bsFs.createAliasFile(
          aliasDir, name, originalCommand
        );
        const aliasMainPath = await bsFs.upsertFolderMain(aliasDir)
        const sourceString = bsFs.toSourceString(aliasMainPath);

        if (isGlobal) {
          await bsFs.updateBashProfile(sourceString);
          // TODO: this returns 404 not found... why?
          // const sourceFile = Deno.run({
          //   cmd: ['source', aliasMainPath],
          // });
          return console.log(bsFs.toSourceString(bsFs.bashProfilePath));
        }

        return console.log(sourceString);
      },
      help: (flags) => {
        logger.info('TODO: add help')
      },
    },
    project: {
      exec: async (flags) => {
        const projectPath = await bsFs.getProjectDir(bsFs.paths.bin.project);
        return logger.info(`Project folder at: ${projectPath}`);
      },
    },
    script: {
      exec: async (flags) => {
        const name = flags.name || flags.n;
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
      exec: async (flags) => {
        const isGlobal = (flags.g || flags.global);
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
    exec: async (flags) => {
      const aliasesFileNames = [];
      const scriptsFileNames = [];
      const result = {};

      const alias = flags.a || flags.alias;
      const isGlobal = flags.g || flags.global;
      const scripts = flags.s || flags.script;

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

function isHelp(params, flags) {
  const needHelp = flags.h || flags.help;
  if (!needHelp) {
    return null;
  }
  if (params.length < 1) {
    // compile global help;
    // return global help;
    return () => console.log('help is on its way');
  }
  const func = params.reduce((result, name) => {
    if (!result[name]) {
      // TODO: return help
      throw new Error('Not a command');
    } 
    return result[name];
   }, commands);
  return !func.help ? () => console.log('help is on its way') : func.help;
}


function runner(input) {
  const { _, ...rest } = input;
  const needHelp = isHelp(_, rest);
  if (needHelp) {
    return needHelp();
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
  return func.exec(rest);
}

runner(inputArgs);