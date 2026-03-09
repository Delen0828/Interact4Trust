# Generator Option Test Report

Generated at: 2026-03-05T05:11:56.579Z
Checks: 14, Passed: 14, Failed: 0

## Check Results
- PASS: numPred_3: stock A has 3 scenarios (expected 3)
- PASS: numPred_3: stock B has 3 scenarios (expected 3)
- PASS: numPred_16: stock A has 16 scenarios (expected 16)
- PASS: numPred_16: stock B has 16 scenarios (expected 16)
- PASS: histStart_55: historical start mean 55.00 ~= 55
- PASS: histEnd_18: historical end mean 18.00 ~= 18
- PASS: predStart_62: prediction start mean 62.00 ~= 62
- PASS: predEnd_15: prediction end mean 15.00 ~= 15
- PASS: noiseLevel: historical residual variance rises from 0.09 to 9.69
- PASS: noiseLevel: prediction residual variance rises from 0.10 to 8.42
- PASS: predVariance: endpoint spread rises from 1.00 to 224.99
- PASS: skew_up: positive endpoint ratio 0.70 > 0.55
- PASS: skew_down: positive endpoint ratio 0.30 < 0.45
- PASS: skew_bimodel: positive endpoint ratio 0.50 is near 0.50

## Visual Validation
- Open `script/test_output/option_tests_viewer.html` through a local server to inspect all generated datasets with `conditions.html`.