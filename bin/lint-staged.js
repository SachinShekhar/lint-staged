#!/usr/bin/env node

'use strict'

const { supportsColor } = require('chalk')
const cmdline = require('commander')
const debugLib = require('debug')
const debug = debugLib('lint-staged:bin')

const lintStaged = require('../lib')
const { version } = require('../package.json')

// Force colors for packages that depend on https://www.npmjs.com/package/supports-color
if (supportsColor && supportsColor.level) {
  process.env.FORCE_COLOR = supportsColor.level.toString()
}

// Do not terminate main Listr process on SIGINT
process.on('SIGINT', () => {})

cmdline
  .version(version)
  .option('--allow-empty', 'allow empty commits when tasks revert all staged changes', false)
  .option('-c, --config [path]', 'path to configuration file')
  .option('-d, --debug', 'print additional debug information', false)
  .option('--no-stash', 'disable the backup stash, and do not revert in case of errors', false)
  .option(
    '-p, --concurrent <parallel tasks>',
    'the number of tasks to run concurrently, or false to run tasks serially',
    true
  )
  .option('-q, --quiet', 'disable lint-staged’s own console output', false)
  .option('-r, --relative', 'pass relative filepaths to tasks', false)
  .option('-x, --shell', 'Unsafely skip parsing and run tasks in a real shell', false)
  .option('--unsafe-shell-disable-warnings', 'Unsafely enable shell and disable warning', false)
  .option(
    '-v, --verbose',
    'show task output even when tasks succeed; by default only failed output is shown',
    false
  )
  .parse(process.argv)

if (cmdline.debug) {
  debugLib.enable('lint-staged*')
}

debug('Running `lint-staged@%s`', version)

/**
 * Get the maximum length of a command-line argument string based on current platform
 *
 * https://serverfault.com/questions/69430/what-is-the-maximum-length-of-a-command-line-in-mac-os-x
 * https://support.microsoft.com/en-us/help/830473/command-prompt-cmd-exe-command-line-string-limitation
 * https://unix.stackexchange.com/a/120652
 */
const getMaxArgLength = () => {
  switch (process.platform) {
    case 'darwin':
      return 262144
    case 'win32':
      return 8191
    default:
      return 131072
  }
}

const options = {
  allowEmpty: !!cmdline.allowEmpty,
  concurrent: cmdline.concurrent,
  configPath: cmdline.config,
  debug: !!cmdline.debug,
  maxArgLength: getMaxArgLength() / 2,
  stash: !!cmdline.stash, // commander inverts `no-<x>` flags to `!x`
  quiet: !!cmdline.quiet,
  relative: !!cmdline.relative,
  shell: !!cmdline.shell,
  unsafeShellDisableWarnings: !!cmdline.unsafeShellDisableWarnings,
  verbose: !!cmdline.verbose,
}

debug('Options parsed from command-line:', options)

lintStaged(options)
  .then((passed) => {
    process.exitCode = passed ? 0 : 1
  })
  .catch(() => {
    process.exitCode = 1
  })
