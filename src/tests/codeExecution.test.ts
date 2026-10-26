/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { executeCodeSandbox } from '../../server/services/codeExecutionService.ts';

export async function runCodeExecutionTests(): Promise<{ passed: boolean; message: string }> {
  console.log('--- Testing Monaco Code Execution Sandbox ---');

  // 1. Correct Two Sum implementation in JavaScript
  const jsCode = `
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}
`;

  const testCases = [
    { input: '[2,7,11,15], 9', expectedOutput: '[0,1]' },
    { input: '[3,2,4], 6', expectedOutput: '[1,2]' },
  ];

  const result = await executeCodeSandbox({
    language: 'javascript',
    code: jsCode,
    testCases,
  });

  if (!result.allPassed || result.passedTests !== 2) {
    throw new Error(`Code Sandbox test failed: Expected 2 passed tests, got ${result.passedTests}`);
  }
  console.log(`✓ JavaScript sandbox executed test cases (${result.executionTimeMs}ms) - ALL PASSED.`);

  // 2. Syntax Error Trapping
  const brokenCode = `function invalid( { return 42;`;
  const brokenResult = await executeCodeSandbox({
    language: 'javascript',
    code: brokenCode,
    testCases,
  });

  if (brokenResult.success || !brokenResult.stderr) {
    throw new Error('Sandbox error trap failed: Syntax error was not caught!');
  }
  console.log('✓ Syntax error caught safely in sandbox without crashing server.');

  return { passed: true, message: 'Code sandbox execution tests passed!' };
}
