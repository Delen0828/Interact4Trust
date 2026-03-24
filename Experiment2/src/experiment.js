// Humidity Prediction Visualization Trust Study
// Multi-Round Within-Participants Study Design (Participant-Randomized Sequence)

let jsPsych;
let timeline = [];
const instructionStimulusPath = new URL('./stimuli/Instruction.png', import.meta.url).href;
const defaultOrganizationLabelsBySlot = Object.freeze([
	'Organization A',
	'Organization B',
	'Organization C',
	'Organization D',
	'Organization E',
	'Organization F',
	'Organization G',
	'Organization H',
	'Organization I',
	'Organization J'
]);
const defaultRoundDatasetConfig = Object.freeze({
	file: null,
	organization: defaultOrganizationLabelsBySlot[0],
	cityA: 'City A',
	cityB: 'City B',
	colors: {
		cityA: '#0891B2',
		cityB: '#7C3AED'
	}
});
const datasetConfigByFile = Object.freeze({
	'ranax_leer_city_baseline.json': {
		cityA: 'Ranax',
		cityB: 'Leer City',
		colors: { cityA: '#1D4ED8', cityB: '#C2410C' }
	},
	'virexa_talmori_incHist_incPred.json': {
		cityA: 'Virexa',
		cityB: 'Talmori',
		colors: { cityA: '#2563EB', cityB: '#D97706' }
	},
	'qelvane_rostiva_incHist_decPred.json': {
		cityA: 'Qelvane',
		cityB: 'Rostiva',
		colors: { cityA: '#059669', cityB: '#DC2626' }
	},
	'nexari_pulveth_decHist_incPred.json': {
		cityA: 'Nexari',
		cityB: 'Pulveth',
		colors: { cityA: '#7C3AED', cityB: '#0EA5E9' }
	},
	'zorvani_kelthar_decHist_decPred.json': {
		cityA: 'Zorvani',
		cityB: 'Kelthar',
		colors: { cityA: '#BE123C', cityB: '#0F766E' }
	},
	'lumora_vexlin_constHist_incPred.json': {
		cityA: 'Lumora',
		cityB: 'Vexlin',
		colors: { cityA: '#0369A1', cityB: '#B45309' }
	},
	'dravik_solmere_constHist_decPred.json': {
		cityA: 'Dravik',
		cityB: 'Solmere',
		colors: { cityA: '#7E22CE', cityB: '#0E7490' }
	},
	'altriva_morneth_incHist_constPred.json': {
		cityA: 'Altriva',
		cityB: 'Morneth',
		colors: { cityA: '#1E3A8A', cityB: '#B45309' }
	},
	'solnara_kyveth_decHist_constPred.json': {
		cityA: 'Solnara',
		cityB: 'Kyveth',
		colors: { cityA: '#BE123C', cityB: '#155E75' }
	}
});
const SAVE_MAX_ATTEMPTS = 3;
const SAVE_MAX_DURATION_MS = 8000;
const SAVE_RETRY_DELAY_MS = 350;
let studyFinalizationInProgress = false;

function normalizeDatasetFile(datasetFile) {
	if (typeof datasetFile !== 'string') return '';
	const trimmed = datasetFile.trim();
	if (!trimmed) return '';
	return trimmed.split('/').pop() || trimmed;
}

function shuffleArray(items) {
	const shuffled = Array.isArray(items) ? items.slice() : [];
	for (let i = shuffled.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

function isBaselineCondition(condition) {
	if (!condition || typeof condition !== 'object') return false;
	const conditionId = String(condition.id || '').toLowerCase();
	if (conditionId.includes('baseline')) {
		return true;
	}

	const cityAType = condition.cityAType || 'line';
	const cityBType = condition.cityBType || 'line';
	const cityALineCount = Number(condition.cityALineCount || 1);
	const cityBLineCount = Number(condition.cityBLineCount || 1);

	return cityAType === 'line'
		&& cityBType === 'line'
		&& cityALineCount <= 1
		&& cityBLineCount <= 1;
}

function buildRandomizedRoundPlan(sourceConditions) {
	if (!Array.isArray(sourceConditions) || sourceConditions.length === 0) {
		return [];
	}

	const copiedConditions = sourceConditions.map((condition) => ({ ...condition }));
	const baselineCondition = copiedConditions.find((condition) => isBaselineCondition(condition)) || null;
	const nonBaselineConditions = baselineCondition
		? copiedConditions.filter((condition) => condition !== baselineCondition)
		: copiedConditions;
	const randomizedNonBaselineConditions = shuffleArray(nonBaselineConditions);
	const randomizedConditions = baselineCondition
		? [baselineCondition, ...randomizedNonBaselineConditions]
		: randomizedNonBaselineConditions;

	const configuredDatasetFiles = [
		...new Set(
			copiedConditions
				.map((condition) => normalizeDatasetFile(condition?.datasetFile))
				.filter((datasetFile) => datasetFile.length > 0)
		)
	];
	const fallbackDatasetFiles = Object.keys(datasetConfigByFile).filter((datasetFile) => {
		return !configuredDatasetFiles.includes(datasetFile);
	});
	const availableDatasetFiles = [...configuredDatasetFiles, ...fallbackDatasetFiles];

	if (availableDatasetFiles.length === 0) {
		throw new Error('No eligible dataset files available for Experiment 2 randomization.');
	}

	const randomizedDatasets = shuffleArray(availableDatasetFiles);
	return randomizedConditions.map((condition, index) => {
		return {
			...condition,
			datasetFile: randomizedDatasets[index % randomizedDatasets.length]
		};
	});
}

// Wait for config to be loaded
function waitForConfig() {
	return new Promise((resolve, reject) => {
		const checkConfig = () => {
			if (window.ExperimentConfig && window.ParticipantConfig && window.initializeParticipant) {
						resolve();
			} else {
					setTimeout(checkConfig, 50);
			}
		};
		checkConfig();
		
		// Timeout after 5 seconds
		setTimeout(() => {
			reject(new Error('Timeout waiting for config to load. Check if config.js is properly loaded.'));
		}, 5000);
	});
}

// Initialize experiment
async function initializeExperiment() {
	try {
		// Wait for config to be available
		await waitForConfig();
		
		// Load prediction task plugin dynamically
		const predictionModule = await import('./plugins/jspsych-prediction-task.js');
		
		// Load custom survey plugins
		const trustSurveyModule = await import('./plugins/jspsych-trust-survey.js');
		const personalitySurveyModule = await import('./plugins/jspsych-personality-survey.js');
		const interactionFeedbackModule = await import('./plugins/jspsych-interaction-feedback.js');
		
		// Register the plugins with jsPsych
		window.jsPsychPredictionTask = predictionModule.default || predictionModule.jsPsychPredictionTask;
		window.jsPsychTrustSurvey = trustSurveyModule.default || trustSurveyModule.jsPsychTrustSurvey;
		window.jsPsychPersonalitySurvey = personalitySurveyModule.default || personalitySurveyModule.jsPsychPersonalitySurvey;
		window.jsPsychInteractionFeedback = interactionFeedbackModule.default || interactionFeedbackModule.jsPsychInteractionFeedback;
		
		// Check if jsPsych is available
		if (typeof initJsPsych === 'undefined') {
			throw new Error('jsPsych library not loaded. Check if jspsych scripts are properly included.');
		}
		
			// Initialize jsPsych
			jsPsych = initJsPsych({
				display_element: 'jspsych-target',
				// show_progress_bar: true,
				// auto_update_progress_bar: false,
				// message_progress_bar: 'Study Progress',
				on_finish: function () {}
			});

		// Build timeline
		buildTimeline();

		// Start experiment
		jsPsych.run(timeline);
		
	} catch (error) {
		console.error('Experiment initialization failed:', error);
		
		document.getElementById('jspsych-target').innerHTML = `
			<div style="text-align: center; padding: 50px;">
				<h2 style="color: #dc2626;">Error Loading Study</h2>
				<p><strong>Error:</strong> ${error.message}</p>
				<p><strong>Type:</strong> ${error.name}</p>
				<div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 5px; text-align: left;">
					<strong>Debug Info:</strong><br>
					<span style="font-family: monospace; font-size: 12px;">
						Config loaded: ${window.ExperimentConfig ? '✅' : '❌'}<br>
						jsPsych available: ${typeof initJsPsych !== 'undefined' ? '✅' : '❌'}<br>
						Timeline length: ${timeline ? timeline.length : 'undefined'}<br>
						Error stack: ${error.stack}
					</span>
				</div>
				<p style="margin-top: 20px;">Please check the browser console for more details and refresh the page to try again.</p>
			</div>
		`;
	}
}

// Build experiment timeline
function buildTimeline() {
	const allConditions = Array.isArray(window.ExperimentConfig.conditions)
		? window.ExperimentConfig.conditions
		: [];
	const configuredSequence = Array.isArray(window.ExperimentConfig.variantSequence)
		? window.ExperimentConfig.variantSequence
		: [];
	const sourceConditions = configuredSequence.length > 0
		? configuredSequence
			.map((conditionId) => allConditions.find((condition) => condition.id === conditionId))
			.filter(Boolean)
		: allConditions;
	const orderedConditions = buildRandomizedRoundPlan(sourceConditions);
	const effectiveVariantSequence = orderedConditions.map((condition) => condition.id);
	const effectiveDatasetSequence = orderedConditions.map((condition) => normalizeDatasetFile(condition.datasetFile));

	if (orderedConditions.length === 0) {
		throw new Error('No visualization variants found in ExperimentConfig.conditions.');
	}

	function escapeHtml(value) {
		return String(value ?? '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function getOrganizationLabel(roundNumber) {
		return defaultOrganizationLabelsBySlot[roundNumber - 1] || `Organization ${roundNumber}`;
	}

	function getOrganizationBadgeHtml(organizationLabel) {
		return `<span class="organization-badge">${escapeHtml(organizationLabel)}</span>`;
	}

	function getOrganizationListHtml(totalRounds) {
		const badges = [];
		for (let roundNumber = 1; roundNumber <= totalRounds; roundNumber += 1) {
			badges.push(getOrganizationBadgeHtml(getOrganizationLabel(roundNumber)));
		}

		if (badges.length === 0) return '';
		if (badges.length === 1) return badges[0];
		if (badges.length === 2) return `${badges[0]} and ${badges[1]}`;
		return `${badges.slice(0, -1).join(', ')}, and ${badges[badges.length - 1]}`;
	}

	const forecastConditionCount = orderedConditions.length;
	const organizationListHtml = getOrganizationListHtml(forecastConditionCount);

	function resolveRoundDatasetConfig(roundNumber, condition) {
		const datasetFile = normalizeDatasetFile(condition?.datasetFile);
		const datasetKey = datasetFile;
		const mappedConfig = datasetConfigByFile[datasetKey] || {};
		const configuredColors = condition?.cityColors || condition?.colors || {};
		const fallbackOrganization = getOrganizationLabel(roundNumber);
		return {
			file: datasetFile || null,
			organization: condition?.organization || mappedConfig.organization || fallbackOrganization,
			cityA: condition?.cityA || mappedConfig.cityA || defaultRoundDatasetConfig.cityA,
			cityB: condition?.cityB || mappedConfig.cityB || defaultRoundDatasetConfig.cityB,
			colors: {
				cityA: configuredColors.cityA || configuredColors.stockA || mappedConfig.colors?.cityA || defaultRoundDatasetConfig.colors.cityA,
				cityB: configuredColors.cityB || configuredColors.stockB || mappedConfig.colors?.cityB || defaultRoundDatasetConfig.colors.cityB
			}
		};
	}

	function getRoundOrganizationLabel(roundNumber, condition) {
		return resolveRoundDatasetConfig(roundNumber, condition).organization;
	}

	function getRoundOrganizationBadgeHtml(roundNumber, condition) {
		return getOrganizationBadgeHtml(getRoundOrganizationLabel(roundNumber, condition));
	}

	function replaceCityNames(text, cityA, cityB) {
		return String(text || '')
			.replace(/\bCity A\b/g, cityA)
			.replace(/\bCity B\b/g, cityB);
	}

	function getRoundQuestionText(roundNumber, condition) {
		const roundDataset = resolveRoundDatasetConfig(roundNumber, condition);
		return replaceCityNames(window.ExperimentConfig.predictionTask.question, roundDataset.cityA, roundDataset.cityB);
	}

	function getRoundTravelQuestionText(roundNumber, condition) {
		const roundDataset = resolveRoundDatasetConfig(roundNumber, condition);
		return replaceCityNames(window.ExperimentConfig.predictionTask.travelQuestion, roundDataset.cityA, roundDataset.cityB);
	}

	function getRoundTravelChoices(roundNumber, condition) {
		const roundDataset = resolveRoundDatasetConfig(roundNumber, condition);
		return window.ExperimentConfig.predictionTask.travelChoices.map((choice) => {
			return replaceCityNames(choice, roundDataset.cityA, roundDataset.cityB);
		});
	}

	function getRoundTrialData(trialType, roundNumber, condition, extraData = {}) {
		const roundDataset = resolveRoundDatasetConfig(roundNumber, condition);
		return {
			trial_type: trialType,
			phase: 2,
			round: roundNumber,
			condition_id: condition ? condition.id : null,
			condition_name: condition ? condition.name : null,
			display_format: condition ? condition.displayFormat : null,
			dataset_file: roundDataset.file,
			forecast_organization: roundDataset.organization,
			city_a_label: roundDataset.cityA,
			city_b_label: roundDataset.cityB,
			city_a_color: roundDataset.colors.cityA,
			city_b_color: roundDataset.colors.cityB,
			completed_condition_ids: window.ParticipantConfig.completedConditionIds || [],
			variant_sequence: effectiveVariantSequence,
			dataset_sequence: effectiveDatasetSequence,
			...extraData
		};
	}

	function applyParticipantRoundMetadata() {
		window.ParticipantConfig.variantSequence = effectiveVariantSequence.slice();
		window.ParticipantConfig.datasetSequence = effectiveDatasetSequence.slice();
		window.ParticipantConfig.conditionDatasetAssignments = orderedConditions.map((condition, roundIndex) => {
			return {
				round: roundIndex + 1,
				condition_id: condition.id,
				condition_name: condition.name,
				dataset_file: normalizeDatasetFile(condition.datasetFile)
			};
		});
		window.ParticipantConfig.assignedCondition = orderedConditions[0] || null;
	}

	// Preload mini-VLAT images
	timeline.push({
		type: jsPsychPreload,
		images: [
			'../src/stimuli/minivlat-images/LineChart.png',
			'../src/stimuli/minivlat-images/BarChart.png',
			'../src/stimuli/minivlat-images/StackedBar.png',
			'../src/stimuli/minivlat-images/Stacked100.png',
			'../src/stimuli/minivlat-images/PieChart.png',
			'../src/stimuli/minivlat-images/Histogram.png',
			'../src/stimuli/minivlat-images/Scatterplot.png',
			'../src/stimuli/minivlat-images/AreaChart.png',
			'../src/stimuli/minivlat-images/StackedArea.png',
			'../src/stimuli/minivlat-images/BubbleChart.png',
			'../src/stimuli/minivlat-images/Choropleth.png',
			'../src/stimuli/minivlat-images/TreeMap.png',
			instructionStimulusPath
		],
		message: 'Loading assessment images...',
		show_progress_bar: true,
		continue_after_error: false,
		data: { trial_type: 'preload' }
	});

	// Welcome screen
	timeline.push({
		type: jsPsychHtmlButtonResponse,
		stimulus: `
	        <div class="welcome-screen">
	            <h1>Humidity Prediction Study</h1>
	            <p>Welcome! You are about to participate in a research study about how people make decisions using Humidity predictions. This study examines how different ways of presenting prediction information affect trust and decision-making. The study will take approximately 30 minutes.</p>
	            <div class="study-info">
	                <h3>What you'll do:</h3>
	                <ul>
	                    <li>Complete a brief assessment of visualization understanding</li>
	                    <li>Make predictions about humidity in two cities</li>
	                    <li>Answer questions about your confidence and trust</li>
	                    <li>Report basic demographic data</li>
	                </ul>
	            </div>
	        </div>
	    `,
		choices: ['Begin Study'],
		data: { trial_type: 'welcome' }
	});

	// Fullscreen entry
	timeline.push({
		type: jsPsychFullscreen,
		fullscreen_mode: true,
		message: `
	        <div style="text-align: center; padding: 40px;">
	            <h3>Enter Fullscreen Mode</h3>
	            <p>For the best experience, this study will run in fullscreen mode.</p>
	            <p>Please click the button below to enter fullscreen and continue.</p>
	        </div>
	    `,
		button_label: 'Enter Fullscreen',
		data: { trial_type: 'fullscreen_enter' }
	});

	// Participant ID collection
	timeline.push({
		type: jsPsychSurveyText,
		questions: [
			{
				prompt: 'Please enter your participant ID from Prolific:',
				name: 'participant_id',
				required: true,
				placeholder: 'Enter your ID'
			}
		],
		button_label: 'Continue',
		on_finish: function(data) {
			const participantId = data.response.participant_id;
			window.initializeParticipant(participantId);
			applyParticipantRoundMetadata();

			jsPsych.data.addProperties({
				participant_id: participantId,
				study_type: window.ExperimentConfig.studyType || null,
				version: window.ParticipantConfig.version || null,
				variant_sequence: effectiveVariantSequence,
				dataset_sequence: effectiveDatasetSequence,
				condition_dataset_assignments: window.ParticipantConfig.conditionDatasetAssignments || []
			});
		},
		data: { trial_type: 'participant_id_collection' }
	});

	// Consent form
	timeline.push({
		type: jsPsychHtmlButtonResponse,
		stimulus: `
	        <div class="consent-form">
	            <h2>Consent Form</h2>
	            <div class="consent-header">
	                <p><strong>Principal Investigator:</strong> Dr. Cindy Xiong Bearfield, Assistant Professor</p>
	                <p><strong>Study Title:</strong> Trusting What We See: Effect of Interactivity in Visual Data Analysis</p>
	                <p><strong>Supported By:</strong> Georgia Institute of Technology</p>
	            </div>
	            
	            <div class="consent-details">
	                <h3>WHAT IS THIS FORM?</h3>
	                <p>This form is called a Consent Form. It will give you information about the study so you can make an informed decision about participation in this research. We encourage you to take some time to think this over and ask questions now and at any other time. If you decide to participate, you will be asked to sign this form and you will be given a copy for your records.</p>

	                <h3>WHAT ARE SOME OF THE IMPORTANT ASPECTS OF THIS RESEARCH STUDY THAT I SHOULD BE AWARE OF?</h3>
	                <ul>
	                    <li>Whether or not you take part is up to you.</li>
	                    <li>You can choose not to take part.</li>
	                    <li>You can agree to take part and later change your mind.</li>
	                    <li>Your decision will not be held against you.</li>
	                </ul>

	                <h3>WHY ARE WE DOING THIS RESEARCH STUDY?</h3>
	                <p>The purpose of our study is to explore the visualization design space so we can understand how people perceive, interpret, and make decisions from visualizations. The results from this study can help us design visualizations and visualization guidelines to help people better communicate and understand data.</p>

	                <h3>WHO CAN PARTICIPATE IN THIS RESEARCH STUDY?</h3>
	                <p>Participants in this study must be at least 18 years of age or older and have general familiarity with using web-based systems. Participants currently outside of the U.S. cannot participate in this study (e.g. in the European Union or China).</p>

	                <h3>WHAT COMPENSATION I WILL RECEIVE?</h3>
	                <p>You will receive payment through Prolific worth $12/hour for participating in this study. We expect this study to take less than 20 minutes. Your participation is entirely voluntary. You are free to withdraw at any time, and if you do, you will receive partial payment for your time.</p>

	                <h3>HOW MANY PEOPLE WILL PARTICIPATE?</h3>
	                <p>We expect about 200 people will be in this research study.</p>

	                <h3>WHAT WILL I BE ASKED TO DO AND HOW MUCH TIME WILL IT TAKE?</h3>
	                <p>We will show you several data visualizations or components of a visualization and ask you to perform a visual task with the visualization on a computer screen, such as counting, searching, recognizing, memorizing, or describing the information presented to you. We may also ask you to fill out questionnaires concerning your thoughts regarding the visualization you saw. We expect that you will be in this research study to take between 15 and 60 minutes. We expect this study to be a one-off session and will not contact you regarding the study itself in the future.</p>

	                <h3>WILL BEING IN THIS RESEARCH STUDY HELP ME IN ANY WAY?</h3>
	                <p>You are not likely to have any direct benefit from being in this research study. The potential benefits to you from participation may include learning about how data visualization research is conducted, and you may learn about issues of current interest in data visualization and psychology.</p>

	                <h3>WHAT ARE MY RISKS OF BEING IN THIS RESEARCH STUDY?</h3>
	                <p>Your participation in this study does not involve any risks other than what you would encounter in daily life. In particular, you may experience fatigue or boredom, however, you may take breaks between tasks. The effects of participating should be comparable to those you would experience from viewing a computer monitor and using a keyboard. You may withdraw at any time.</p>

	                <h3>HOW WILL MY PERSONAL INFORMATION BE PROTECTED?</h3>
	                <p>We will comply with any applicable laws and regulations regarding confidentiality. To make sure that this research is being carried out in the proper way, the Georgia Institute of Technology IRB may review study records. The Office of Human Research Protections may also look at study records.</p>
	                <p>Efforts will be made to limit the use and disclosure of your personal information, including research study records, to people who need to review this information. We cannot promise complete secrecy. Organizations that may inspect and copy your information include the IRB and other representatives of this institution. Please be notified that our data privacy policy is based on U.S. regulations. Participants who are out of the U.S. might be excluded due to different data privacy requirements.</p>
	                <p><strong>Data Sharing:</strong> De-identified data from this study will be shared among the GATech research team, as well as the research community at large to advance science and health. We will remove or code any personal information that could identify you before files are shared with other researchers to ensure that, by current scientific standards and known methods, no one will be able to identify you from the information we share. Despite these measures, we cannot guarantee the anonymity of your personal data.</p>

	                <h3>WILL I BE GIVEN ANY MONEY OR OTHER COMPENSATION FOR BEING IN THIS RESEARCH STUDY?</h3>
	                <p>If you agree to take part in this research study, we will provide compensation. You will be paid in accordance with the stated policies of Amazon Mechanical Turk and/or Prolific.com. Payment will be made upon completion and acceptance of tasks that you have agreed to complete and you will be paid via Mechanical Turk or Prolific.com. If you choose to withdraw from the study, you will not be compensated for your participation.</p>

	                <h3>WHAT ELSE DO I NEED TO KNOW?</h3>
	                <p>We might be using attention check questions in our surveys. If you miss 2 or more attention check questions, your HIT will not be accepted and you will not be compensated.</p>

	                <h3>WHO CAN I TALK TO IF I HAVE QUESTIONS?</h3>
	                <p>If you have any questions about the content of this research project, you may contact Dr. Cindy Xiong Bearfield at cxiong@gatech.edu, or contact Songwen Hu at shu343@gatech.edu. If you have any questions about your rights as a research subject, you may also contact Georgia Institute of Technology Office of Research Integrity Assurance at IRB@gatech.edu.</p>

	                <h3>WHAT HAPPENS IF I SAY YES, BUT I CHANGE MY MIND LATER?</h3>
	                <p>You can decide not to participate in this research or you can start and then decide to leave the research at any time and it will not be held against you. To do so, simply exit the experiment. Any data already collected will not be saved.</p>

	                <p><strong>By clicking "I agree" below you are indicating that you are at least 18 years old, currently in the U.S., have read this consent form, and agree to participate in this research study. Please print a copy of this page for your records.</strong></p>
	            </div>
	        </div>
	    `,
		choices: ['I agree', 'I do not agree'],
		data: { trial_type: 'consent' },
		on_finish: function(data) {
			if (data.response === 1) {
				jsPsych.endExperiment('<div style="text-align: center; padding: 50px;"><h2>Thank you for your interest.</h2><p>You have chosen not to participate in this study. The experiment has ended.</p><p>You may now close this window.</p></div>');
			}
		}
	});

	// Mini-VLAT introduction
	timeline.push({
		type: jsPsychHtmlButtonResponse,
		stimulus: `
	        <div class="vis-literacy-intro">
	            <h2>Visualization Assessment</h2>
	            <p>Before we begin the main study, we'd like to assess your ability to read and interpret data visualizations.</p>
	            
	            <div class="assessment-info">
	                <h3>What you'll do:</h3>
	                <ul>
	                    <li>View 12 different data visualizations (charts and graphs)</li>
	                    <li>Answer questions about what each visualization shows</li>
	                    <li>Take your time to examine each chart carefully</li>
	                </ul>
	                
	                <p><strong>This assessment will take approximately 5-10 minutes.</strong></p>
	                <p>There are no right or wrong interpretations - we're interested in how you read visualizations.</p>
	            </div>
	            <div class="assessment-info">
	                <h3>Main task (after the assessment):</h3>
	                <p>You will make predictions about humidity in two hypothetical cities (the names vary by forecast round).</p>
	                <p>Humidity is measured on a scale from 0 to 100, and your task is to predict which city is likely to have higher or lower humidity in the future.</p>
	            </div>
	        </div>
	    `,
		choices: ['Begin Assessment'],
		data: { trial_type: 'mini_vlat_intro' }
	});

	// Mini-VLAT
	timeline.push({
		type: jsPsychVisLiteracy,
		randomize_order: false,
		data: function() {
			return {
				trial_type: 'mini_vlat',
				variant_sequence: effectiveVariantSequence,
				dataset_sequence: effectiveDatasetSequence
			};
		},
		on_finish: function(data) {
			window.ParticipantConfig.visualizationLiteracyScore = data.total_score;
		}
	});

	// Instructions
	timeline.push({
		type: jsPsychInstructions,
		pages: [
			`<div class="instructions">
	            <h2>Humidity Context</h2>
	            <p>You will be making predictions about humidity in two hypothetical cities (names shown in each forecast round).</p>
	            <p>Humidity is measured in a scale from 0 to 100.</p>
	            <p>Your task is to predict which city is likely to have higher or lower humidity in the future.</p>
	        </div>`,
			`<div class="instructions">
	            <h2>Humidity Context</h2>
	            <p>You will complete <strong>${forecastConditionCount} forecast conditions</strong>. Each condition includes one prediction page, one interaction feedback page, trust questions, and interaction questions.</p>
	            <p>These conditions are from different organizations: ${organizationListHtml}.</p>
	        </div>`
		],
		show_clickable_nav: true,
		data: { trial_type: 'instructions' }
	});

	timeline.push({
		type: jsPsychHtmlButtonResponse,
		stimulus: `
			<style>
				.phase-intro-wrapper {
					max-width: min(94vw, 1200px);
					margin: 0 auto;
				}
				.phase-intro {
					margin-bottom: 20px;
				}
				#phase-intro-instruction-stimulus {
					display: block;
					max-width: min(94vw, 1200px);
					max-height: 68vh;
					width: auto;
					height: auto;
					object-fit: contain;
					margin: 0 auto;
				}
			</style>
			<div class="phase-intro-wrapper">
				<div class="phase-intro">
					<h2>Humidity Forecast Rounds</h2>
					<p>Read the instruction below carefully before you proceed</p>
				</div>
				<img id="phase-intro-instruction-stimulus" src="${instructionStimulusPath}" alt="Forecast round instructions" />
			</div>
		`,
		choices: ['Start Forecast Round 1'],
		data: { trial_type: 'phases_intro' }
	});

	if (!window.ParticipantConfig.assignedCondition) {
		window.initializeParticipant('test_participant');
	}
	applyParticipantRoundMetadata();
	window.ParticipantConfig.completedConditionIds = [];
	window.ParticipantConfig.phase2Complete = false;

	orderedConditions.forEach((condition, roundIndex) => {
		const roundNumber = roundIndex + 1;
		const roundDataset = resolveRoundDatasetConfig(roundNumber, condition);
		const datasetFile = roundDataset.file;

		timeline.push({
			type: jsPsychHtmlButtonResponse,
			stimulus: function() {
				const organizationBadge = getRoundOrganizationBadgeHtml(roundNumber, condition);
				return `
					<div class="phase-intro">
						<h2>Forecast Round ${roundNumber}</h2>
						<p>You will be comparing <strong>${escapeHtml(roundDataset.cityA)}</strong> and <strong>${escapeHtml(roundDataset.cityB)}</strong>.</p>
						<p>The forecast is provided by ${organizationBadge}.</p>
					</div>
				`;
			},
			choices: [`Start Forecast Round ${roundNumber}`],
			data: function() {
				return getRoundTrialData('forecast_round_intro', roundNumber, condition);
			}
		});

		timeline.push({
			type: window.jsPsychPredictionTask,
			phase: 2,
			round: roundNumber,
			show_visualization: true,
			show_predictions: true,
			forecast_organization: function() {
				return getRoundOrganizationLabel(roundNumber, condition);
			},
			visualization_condition: function() {
				return condition;
			},
			air_quality_data: async function() {
				return await getAirQualityData(datasetFile, roundDataset);
			},
			question: function() {
				return getRoundQuestionText(roundNumber, condition);
			},
			confidence_scale: window.ExperimentConfig.predictionTask.confidenceScale,
			travel_question: function() {
				return getRoundTravelQuestionText(roundNumber, condition);
			},
			travel_choices: function() {
				return getRoundTravelChoices(roundNumber, condition);
			},
			city_labels: function() {
				return {
					cityA: roundDataset.cityA,
					cityB: roundDataset.cityB
				};
			},
			city_colors: function() {
				return {
					cityA: roundDataset.colors.cityA,
					cityB: roundDataset.colors.cityB
				};
			},
			data: function() {
				return getRoundTrialData('phase2_prediction', roundNumber, condition, {
					visualization_shown: true,
					predictions_shown: true
				});
			},
			on_finish: function() {
				window.ParticipantConfig.assignedCondition = condition;
				window.ParticipantConfig.completedConditionIds.push(condition.id);
				if (roundNumber === orderedConditions.length) {
					window.ParticipantConfig.phase2Complete = true;
				}
			}
		});

		timeline.push({
			type: window.jsPsychInteractionFeedback,
			preamble: function() {
				const organizationBadge = getRoundOrganizationBadgeHtml(roundNumber, condition);
				return `
					<div class="interaction-feedback-preamble">
						<h3>Interaction Feedback</h3>
						<p>Please share your feedback about the interaction you just experienced for ${organizationBadge}.</p>
					</div>
				`;
			},
			data: function() {
				return getRoundTrialData('interaction_feedback', roundNumber, condition);
			}
		});

		timeline.push({
			type: jsPsychTrustSurvey,
			questions: [
				...window.ExperimentConfig.visualizationTrustQuestions,
				...window.ExperimentConfig.interactionQuestions
			],
			preamble: function() {
				const organizationBadge = getRoundOrganizationBadgeHtml(roundNumber, condition);
				return `
					<div class="trust-survey-preamble">
						<h3>Trust and Interaction Questions</h3>
						<p>Please answer these questions for the forecast from ${organizationBadge}.</p>
					</div>
				`;
			},
			data: function() {
				return getRoundTrialData('trust_survey_combined', roundNumber, condition);
			},
			on_finish: function(data) {
				data.skeptical_rating = data.response.skeptical_rating !== null ? data.response.skeptical_rating + 1 : null;
				data.data_trust = data.response.data_trust !== null ? data.response.data_trust + 1 : null;
				data.usability_difficulty = data.response.usability_difficulty !== null ? data.response.usability_difficulty + 1 : null;
				data.comprehension_ease = data.response.comprehension_ease !== null ? data.response.comprehension_ease + 1 : null;

				data.trust_composite = data.data_trust !== null ? data.data_trust : null;
				data.usability_composite = data.usability_difficulty && data.comprehension_ease
					? Math.round((data.comprehension_ease + (8 - data.usability_difficulty)) / 2)
					: null;
			}
		});
	});

	// Demographics introduction
	timeline.push({
		type: jsPsychHtmlButtonResponse,
		stimulus: `
			<div class="section-intro">
				<h2>Background Information</h2>
				<p>We're almost finished! This final section will ask for some background information to help us understand our results.</p>
			</div>
		`,
		choices: ['Continue to Background Questions'],
		data: { trial_type: 'demographics_intro' }
	});

	// Personality Self Evaluation
	timeline.push({
		type: jsPsychPersonalitySurvey,
		questions: window.ExperimentConfig.personalityQuestions,
		preamble: `
			<div class="personality-survey-preamble">
				<h3>Personality Self Evaluation</h3>
				<p>Please rate your agreement with the following statements about yourself.</p>
			</div>
		`,
			data: function() {
				return {
					trial_type: 'personality',
					completed_condition_ids: window.ParticipantConfig.completedConditionIds || [],
					variant_sequence: effectiveVariantSequence,
					dataset_sequence: effectiveDatasetSequence
				};
			}
		});

	// Age and major questions
	timeline.push({
		type: jsPsychSurveyText,
		questions: [
			{
				prompt: 'What is your age?',
				name: 'age',
				required: true,
				columns: 5,
				input_type: 'number'
			},
			{
				prompt: 'What is your major/field of work?',
				name: 'major_field',
				required: true,
				columns: 40
			}
		],
			data: function() {
				return {
					trial_type: 'demographics_text_1',
					completed_condition_ids: window.ParticipantConfig.completedConditionIds || [],
					variant_sequence: effectiveVariantSequence,
					dataset_sequence: effectiveDatasetSequence
				};
			}
		});

	// Education and visualization experience
	timeline.push({
		type: jsPsychSurveyMultiChoice,
		questions: [
			{
				prompt: 'What is your highest level of education?',
				name: 'education',
				required: true,
				options: ['High school or equivalent', 'Some college', 'Associate degree', 'Bachelor\'s degree', 'Master\'s degree', 'Doctoral degree', 'Other']
			},
			{
				prompt: 'How often do you work with data visualizations or charts?',
				name: 'viz_experience',
				required: true,
				options: ['Daily', 'Weekly', 'Monthly', 'A few times per year', 'Rarely', 'Never']
			}
		],
			data: function() {
				return {
					trial_type: 'demographics_mc',
					completed_condition_ids: window.ParticipantConfig.completedConditionIds || [],
					variant_sequence: effectiveVariantSequence,
					dataset_sequence: effectiveDatasetSequence
				};
			}
		});

	// Exit fullscreen
	timeline.push({
		type: jsPsychFullscreen,
		fullscreen_mode: false,
		message: `
	        <div style="text-align: center; padding: 40px;">
	            <h3>Study Complete</h3>
	            <p>Thank you for completing the study!</p>
	            <p>Click below to exit fullscreen mode and see the final summary.</p>
	        </div>
	    `,
		button_label: 'Exit Fullscreen',
		data: { trial_type: 'fullscreen_exit' }
	});

	// Debrief
	timeline.push({
		type: jsPsychHtmlButtonResponse,
		stimulus: `
	            <div class="debrief">
	                <h2>Thank You!</h2>
	                <p>This study investigated how different ways of presenting uncertainty in predictions affect trust and decision-making.</p>
	                
	                <h3>Study Background:</h3>
	                <p>You completed ${forecastConditionCount} forecast conditions from different organizations using different visualization styles.</p>
	                
	                <p>The Humidity data you saw was synthetic (computer-generated) for research purposes.</p>
	                
	                <h3>Questions?</h3>
	                <p>If you have questions about this research, please contact the research team.</p>
	                
	                <p>Your participation contributes to understanding how to design better prediction visualizations for real-world applications like weather forecasting, financial predictions, and public health data.</p>
	            </div>
	        `,
		choices: ['Upload Data and Redirect to Prolific'],
		data: { trial_type: 'debrief' },
		on_load: function() {
			setDebriefButtonUploadingState();
		},
		on_finish: function() {
			const completionData = {
				study_complete: true,
				phase1_complete: window.ParticipantConfig.phase1Complete,
				phase2_complete: window.ParticipantConfig.phase2Complete,
				completed_condition_ids: window.ParticipantConfig.completedConditionIds || [],
				variant_sequence: effectiveVariantSequence,
				dataset_sequence: effectiveDatasetSequence,
				condition_dataset_assignments: window.ParticipantConfig.conditionDatasetAssignments || [],
				end_time: new Date().toISOString()
			};
			finalizeStudyAndRedirect(completionData);
		}
	});
}

// Helper Functions


function normalizeRoundDatasetRows(rawRows, datasetConfig = defaultRoundDatasetConfig) {
	if (!Array.isArray(rawRows)) {
		throw new Error(`Expected dataset rows to be an array, got ${typeof rawRows}`);
	}
	if (rawRows.length === 0) {
		throw new Error('Dataset rows array is empty');
	}

	const observedNames = [...new Set(
		rawRows
			.map((row) => row?.stock ?? row?.city)
			.filter((value) => typeof value === 'string' && value.trim().length > 0)
	)];

	const fallbackCityA = observedNames[0] || datasetConfig.cityA || defaultRoundDatasetConfig.cityA;
	const fallbackCityB = observedNames[1] || datasetConfig.cityB || defaultRoundDatasetConfig.cityB;
	const cityAName = observedNames.includes(datasetConfig.cityA) ? datasetConfig.cityA : fallbackCityA;
	const cityBName = observedNames.includes(datasetConfig.cityB) ? datasetConfig.cityB : fallbackCityB;

	const nameToKey = new Map([
		['A', 'A'],
		['B', 'B'],
		[cityAName, 'A'],
		[cityBName, 'B']
	]);

	const normalizedRows = rawRows
		.map((row) => {
			if (!row || typeof row !== 'object') return null;
			const sourceName = row.stock ?? row.city;
			const mappedStock = nameToKey.get(sourceName);
			if (!mappedStock) return null;
			return {
				...row,
				stock: mappedStock
			};
		})
		.filter(Boolean);

	const mappedStocks = new Set(normalizedRows.map((row) => row.stock));
	if (!mappedStocks.has('A') || !mappedStocks.has('B')) {
		throw new Error(
			`Normalized dataset must include both city series (A and B). Found: ${Array.from(mappedStocks).join(', ')}`
		);
	}

	return normalizedRows;
}

// Get Humidity data for a specific round/variant.
async function getAirQualityData(datasetFile = null, datasetConfig = null) {
	try {
		const normalizedFile = typeof datasetFile === 'string' ? datasetFile.trim() : '';
		const candidatePaths = normalizedFile
			? [
				`generated/${normalizedFile}`,
				`../generated/${normalizedFile}`,
				`../../generated/${normalizedFile}`,
				normalizedFile,
				`../${normalizedFile}`,
				`../../${normalizedFile}`
			]
			: [
				'synthetic_stock_data_norm.json',
				'../synthetic_stock_data_norm.json',
				'../../synthetic_stock_data_norm.json'
			];

		let response;
		for (const path of candidatePaths) {
			try {
				response = await fetch(path);
				if (response.ok) {
					break;
				}
			} catch (_error) {
				continue;
			}
		}

		if (!response || !response.ok) {
			throw new Error(`Failed to load data from expected paths: ${candidatePaths.join(', ')}`);
		}
		const cityData = await response.json();

		let data;
		if (cityData && typeof cityData === 'object') {
			if (cityData.data && Array.isArray(cityData.data)) {
				data = cityData.data;
			} else if (Array.isArray(cityData)) {
				data = cityData;
			} else {
				console.error('Unexpected data structure:', cityData);
				throw new Error(`Data is not in expected format. Expected array or {data: array}, got object with keys: ${Object.keys(cityData).join(', ')}`);
			}
		} else {
			throw new Error(`Invalid JSON structure: expected object, got ${typeof cityData}`);
		}

		if (!Array.isArray(data)) {
			throw new Error(`Expected data to be an array, got ${typeof data}`);
		}

		if (data.length === 0) {
			throw new Error('Data array is empty');
		}

		return normalizeRoundDatasetRows(data, datasetConfig || defaultRoundDatasetConfig);

	} catch (error) {
		console.error('Error loading Humidity data:', error);
		throw new Error(`Failed to load required data file: ${error.message}`);
	}
}

function escapeHtmlForFinalization(value) {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function setDebriefButtonUploadingState() {
	const wrapper = document.querySelector('#jspsych-html-button-response-button-0');
	if (!wrapper) return;
	const button = wrapper.querySelector('button') || wrapper;
	button.addEventListener('click', () => {
		button.disabled = true;
		button.textContent = 'Uploading data...';
	}, { once: true });
}

function showFinalizationStatus(title, message) {
	const target = document.getElementById('jspsych-target');
	if (!target) return;
	target.innerHTML = `
		<div style="text-align: center; padding: 40px;">
			<h3>${escapeHtmlForFinalization(title)}</h3>
			<p>${escapeHtmlForFinalization(message)}</p>
		</div>
	`;
}

function getOrCreateSaveToken() {
	if (window.ParticipantConfig.saveToken) return window.ParticipantConfig.saveToken;
	const participantId = String(window.ParticipantConfig.id || 'unknown')
		.replace(/[^a-zA-Z0-9_-]/g, '')
		.slice(0, 32) || 'unknown';
	const timePart = Date.now().toString(36);
	const randomPart = Math.random().toString(36).slice(2, 10);
	window.ParticipantConfig.saveToken = `save_${participantId}_${timePart}_${randomPart}`;
	return window.ParticipantConfig.saveToken;
}

function buildParticipantSummary() {
	return {
		participant_id: window.ParticipantConfig.id,
		condition: window.ParticipantConfig.assignedCondition,
		completed_condition_ids: window.ParticipantConfig.completedConditionIds || [],
		variant_sequence: Array.isArray(window.ParticipantConfig.variantSequence)
			? window.ParticipantConfig.variantSequence
			: (Array.isArray(window.ExperimentConfig.variantSequence) ? window.ExperimentConfig.variantSequence : []),
		dataset_sequence: Array.isArray(window.ParticipantConfig.datasetSequence)
			? window.ParticipantConfig.datasetSequence
			: [],
		condition_dataset_assignments: Array.isArray(window.ParticipantConfig.conditionDatasetAssignments)
			? window.ParticipantConfig.conditionDatasetAssignments
			: [],
		start_time: window.ParticipantConfig.startTime,
		end_time: new Date().toISOString(),
		visualization_literacy_score: window.ParticipantConfig.visualizationLiteracyScore,
		phase1_complete: window.ParticipantConfig.phase1Complete,
		phase2_complete: window.ParticipantConfig.phase2Complete
	};
}

function buildSavePayload(dataCollection) {
	const allData = dataCollection.values();
	const summary = buildParticipantSummary();
	const csvData = convertToCSV(allData, summary);
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('Z', '').split('.')[0];
	const participantIdClean = window.ParticipantConfig.id || 'unknown';
	const participantIdNumber = participantIdClean.toString().replace(/^P/, '');
	const numericId = participantIdNumber.replace(/[^0-9]/g, '') || Date.now();
	const filename = `user_${numericId}_${timestamp}.csv`;
	const saveToken = getOrCreateSaveToken();
	return {
		allData,
		summary,
		csvData,
		filename,
		saveToken
	};
}

function persistLocalFallback(savePayload, errorMessage) {
	try {
		const storageKey = `air_quality_study_${window.ParticipantConfig.id || 'unknown'}`;
		localStorage.setItem(storageKey, JSON.stringify({
			data: savePayload.allData,
			summary: savePayload.summary,
			save_token: savePayload.saveToken,
			filename: savePayload.filename,
			failed_upload: Boolean(errorMessage),
			save_error_last: errorMessage || null,
			saved_at: new Date().toISOString()
		}));
	} catch (storageError) {
		console.error('Error saving fallback payload to localStorage:', storageError);
	}
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadSavePayloadOnce(savePayload, timeoutMs) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const response = await fetch(window.ExperimentConfig.dataCollection.serverEndpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				filedata: savePayload.csvData,
				filename: savePayload.filename,
				save_token: savePayload.saveToken,
				participant_id: window.ParticipantConfig.id || null
			}),
			signal: controller.signal
		});
		if (!response.ok) {
			throw new Error(`Server error: ${response.status}`);
		}
		const result = await response.json();
		if (!result || result.success !== true) {
			throw new Error(result?.error || 'Unknown server save error');
		}
		return result;
	} finally {
		clearTimeout(timeoutId);
	}
}

async function saveWithRetry(savePayload) {
	if (!window.ExperimentConfig.dataCollection.saveToServer) {
		persistLocalFallback(savePayload, null);
		return {
			success: true,
			status: 'saved',
			attempts: 0,
			saveToken: savePayload.saveToken,
			error: null
		};
	}

	const start = Date.now();
	let attempts = 0;
	let lastErrorMessage = null;

	while (attempts < SAVE_MAX_ATTEMPTS && (Date.now() - start) < SAVE_MAX_DURATION_MS) {
		attempts += 1;
		const elapsed = Date.now() - start;
		const remaining = SAVE_MAX_DURATION_MS - elapsed;
		const timeoutMs = Math.max(1000, remaining);

		try {
			await uploadSavePayloadOnce(savePayload, timeoutMs);
			return {
				success: true,
				status: 'saved',
				attempts,
				saveToken: savePayload.saveToken,
				error: null
			};
		} catch (error) {
			lastErrorMessage = error.message;
			if (attempts >= SAVE_MAX_ATTEMPTS) break;
			if ((Date.now() - start) >= SAVE_MAX_DURATION_MS) break;
			await sleep(SAVE_RETRY_DELAY_MS);
		}
	}

	persistLocalFallback(savePayload, lastErrorMessage);
	return {
		success: false,
		status: 'failed_after_retries',
		attempts,
		saveToken: savePayload.saveToken,
		error: lastErrorMessage
	};
}

async function finalizeStudyAndRedirect(completionData) {
	if (studyFinalizationInProgress) return;
	studyFinalizationInProgress = true;
	showFinalizationStatus('Uploading data...', 'Please wait while we save your responses before redirecting.');

	const savePayload = buildSavePayload(jsPsych.data.get());
	const saveResult = await saveWithRetry(savePayload);
	const completionPayload = {
		...completionData,
		save_status: saveResult.status,
		save_token: saveResult.saveToken,
		save_attempts: saveResult.attempts,
		save_error_last: saveResult.error || null
	};

	try {
		const response = await fetch('/complete_study.php', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(completionPayload)
		});
		if (!response.ok) {
			throw new Error(`Completion endpoint error: ${response.status}`);
		}
		const data = await response.json();
		if (data.success && data.redirect_url) {
			window.location.href = data.redirect_url;
			return;
		}
		throw new Error(data?.error || 'Missing redirect URL');
	} catch (error) {
		console.error('Error finalizing study completion:', error);
		showFinalizationStatus('Upload completed, redirect failed', 'Please contact the research team so we can manually confirm your submission.');
		alert('There was an error redirecting to Prolific. Please contact the research team.');
		studyFinalizationInProgress = false;
	}
}

// Convert jsPsych data to CSV format
function convertToCSV(dataArray, summary) {
	if (!dataArray || dataArray.length === 0) {
		return 'participant_id,error\n' + summary.participant_id + ',no_data_collected\n';
	}

	// Get all unique keys from all data objects
	const allKeys = new Set();
	dataArray.forEach(row => {
		Object.keys(row).forEach(key => allKeys.add(key));
	});
	
	// Add summary keys
	Object.keys(summary).forEach(key => allKeys.add(key));
	
	const headers = Array.from(allKeys).sort();
	
	// Create CSV header
	let csv = headers.join(',') + '\n';
	
	// Add data rows
	dataArray.forEach(row => {
		const values = headers.map(header => {
			let value = row[header];
			// Handle different data types
			if (value === null || value === undefined) {
				return '';
			} else if (typeof value === 'object') {
				return '"' + JSON.stringify(value).replace(/"/g, '""') + '"';
			} else if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
				return '"' + value.replace(/"/g, '""') + '"';
			}
			return value;
		});
		csv += values.join(',') + '\n';
	});
	
	// Add summary row
	const summaryValues = headers.map(header => {
		let value = summary[header];
		if (value === null || value === undefined) {
			return '';
		} else if (typeof value === 'object') {
			return '"' + JSON.stringify(value).replace(/"/g, '""') + '"';
		} else if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
			return '"' + value.replace(/"/g, '""') + '"';
		}
		return value;
	});
	csv += summaryValues.join(',') + '\n';
	
	return csv;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function () {
	initializeExperiment();
});
