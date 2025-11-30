### Detailed Study Plan
**Conditions**
Condition 1 (baseline), just prediction
Condition 2, PI plot (area shade)
Condition 3, Ensemble plot (alternative lines)
Condition 4, PI plot + hover on detail
Condition 5, ensemble plot + hover on detail
Condition 6, PI plot -- hover --> ensemble plot
Condition 7 (control), buggy interaction
Condition 8 (control), bad interaction

interaction condition (have control bar or not)
add broken decisions to condition 6 - broken (hover in the wrong place, some prediction misaligned, line can be draggable)
add bad decisions to condition 7 - (click each time, or forcing an animation, pop up windows for 2s and will disappear if you don't catch up)

**Procedure**
1. Consent form
2. User do a visualization literacy test
3. Introduction
4. User make prediction without visualization
	Ask about probability and confidence of their prediction
5. User make prediction with visualization
	Ask about probability and confidence of their prediction
6. Ask about trust questions


**Metrics**:
1. Trust
2. ~~WOA (Weight of Advice) = $|forcast_{final} - forcast_{initial})| / |forcast_{adviced} - forcast_{initial}|$
3. ~~MAE (Mean absolute error)
4. probability, show the drift

**Study**:
1. Let participants predict without any visualization
2. Ask about Confidence/Trust, and Interpretation questions (multiple choice)
3. Let participants predict with uncertainty vis (5 conditions)
4. Ask about Confidence/Trust, and Interpretation questions
5. Evaluate delta_Trust, WOA, MAE

prediction question:
The probability of air quality of city A>city B is ___ 

How confident are you about your prediction?
When making travel plan, I will certainly go to city A than city B.
... I will probably go to city A than city B
... I'm not sure about going to city A or B

trust question:
1. how much do you trust the fidelity of this tool (interface) (do you think this tool is working as expected?)
2. how much do you trust the underlying data (refer to Will's)
3. how much do you think the visualization is misleading (refer to Will's)