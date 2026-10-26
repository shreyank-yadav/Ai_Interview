/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { runPaymentSignatureTests } from './paymentSignature.test.ts';
import { runCodeExecutionTests } from './codeExecution.test.ts';
import { runInterviewFlowTests } from './interviewFlow.test.ts';

async function main() {
  console.log('====================================================');
  console.log('🚀 Running Tanya AI Interviewer Automated Test Suite');
  console.log('====================================================\n');

  let failed = 0;

  try {
    const payRes = await runPaymentSignatureTests();
    console.log(`[PASS] ${payRes.message}\n`);
  } catch (err: any) {
    console.error(`[FAIL] Payment Signature Test Failed:`, err.message, '\n');
    failed++;
  }

  try {
    const codeRes = await runCodeExecutionTests();
    console.log(`[PASS] ${codeRes.message}\n`);
  } catch (err: any) {
    console.error(`[FAIL] Code Sandbox Test Failed:`, err.message, '\n');
    failed++;
  }

  try {
    const flowRes = await runInterviewFlowTests();
    console.log(`[PASS] ${flowRes.message}\n`);
  } catch (err: any) {
    console.error(`[FAIL] Interview Flow Test Failed:`, err.message, '\n');
    failed++;
  }

  console.log('====================================================');
  if (failed > 0) {
    console.error(`❌ ${failed} test suite(s) failed.`);
    process.exit(1);
  } else {
    console.log('✅ ALL TEST SUITES EXECUTED AND PASSED SUCCESSFULLY!');
    console.log('====================================================');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
