// Humidity Prediction Visualization Trust Study
// Four-Phase Within-Participants Study Design

let jsPsych;
let timeline = [];
const airQualityDataCache = new Map();
const instructionStimulusPath = new URL('./stimuli/Instruction.png', import.meta.url).href;
const defaultOrganizationLabelsBySlot = Object.freeze([
	'Organization A',
	'Organization B',
	'Organization C',
	'Organization D'
]);
const defaultPhaseDatasetConfig = Object.freeze({
	file: 'synthetic_stock_data_norm.json',
	organization: defaultOrganizationLabelsBySlot[0],
	cityA: 'City A',
	cityB: 'City B',
	colors: {
		cityA: '#0891B2',
		cityB: '#7C3AED'
	}
});

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
			on_finish: function () {
				const data = jsPsych.data.get();
				saveData(data);
			}
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
	        // Store participant ID for use throughout experiment
	        const participantId = data.response.participant_id;
	        
	        // Initialize participant configuration
	        window.initializeParticipant(participantId);
	        
	        // Add participant/session-level metadata to every trial row
	        jsPsych.data.addProperties({
	        	participant_id: participantId,
	        	study_type: window.ExperimentConfig.studyType || null,
	        	version: window.ParticipantConfig.version || null,
	        	version_descriptor: window.ParticipantConfig.versionDescriptor || null,
	        	phase_execution_order: window.ParticipantConfig.phaseExecutionOrder || null,
	        	phase_assignment_log: window.ParticipantConfig.phaseAssignmentLog || null
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

	// Mini-VLAT Introduction
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

	// Mini-VLAT (Visualization Literacy Assessment Test)
	timeline.push({
	    type: jsPsychVisLiteracy,
	    randomize_order: false, // Keep original question order
	    data: function() {
	        return {
	            trial_type: 'mini_vlat',
	            phase_execution_order: window.ParticipantConfig.phaseExecutionOrder || null,
	            phase_assignment_log: window.ParticipantConfig.phaseAssignmentLog || null
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
		            <p>You will complete <strong>4 forecast rounds</strong>. Each round includes one prediction page, one bug feedback page, trust questions, and interaction questions.</p>
		            <p>Each round is provided by a different source: <span class="organization-badge">Organization A</span>, <span class="organization-badge">Organization B</span>, <span class="organization-badge">Organization C</span>, and <span class="organization-badge">Organization D</span>.</p>
		            <p>The order and condition sequence for Forecast Rounds 2-4 are determined by the study version ID.</p>
		        </div>`
		    ],
	    show_clickable_nav: true,
	    data: { trial_type: 'instructions' }
	});

	timeline.push({
		type: jsPsychImageButtonResponse,
		stimulus: instructionStimulusPath,
		prompt: `
			<style>
				#jspsych-image-button-response-stimulus {
					max-width: min(94vw, 1200px);
					max-height: 68vh;
					width: auto !important;
					height: auto !important;
					object-fit: contain;
				}
				.phase-intro {
					max-width: min(94vw, 1200px);
					margin: 0 auto;
				}
			</style>
			<div class="phase-intro">
				<h2>Humidity Forecast Rounds</h2>
				<p>Read the instruction below carefully before you proceed</p>
			</div>
		`,
		choices: ['Start Forecast Round 1'],
		data: { trial_type: 'phases_intro' }
	});

	const fallbackPhaseOrder = ['phase1', 'phase2', 'phase3', 'phase4'];

	function getPhaseExecutionOrder() {
		const configuredOrder = window.ParticipantConfig.phaseExecutionOrder;
		if (Array.isArray(configuredOrder) && configuredOrder.length === 4) {
			return configuredOrder;
		}
		return fallbackPhaseOrder;
	}

	function getPhaseKeyForSlot(phaseSlot) {
		const order = getPhaseExecutionOrder();
		return order[phaseSlot - 1] || fallbackPhaseOrder[phaseSlot - 1] || `phase${phaseSlot}`;
	}

	function getPhaseConditionForSlot(phaseSlot) {
		const phaseKey = getPhaseKeyForSlot(phaseSlot);
		const assignments = window.ParticipantConfig.phaseAssignments || {};
		return assignments[phaseKey] || null;
	}

	function getPhaseDatasetConfig(phaseSlot) {
		return resolveDatasetConfigForPhase(phaseSlot);
	}

	function getPhaseCityLabels(phaseSlot) {
		const datasetConfig = getPhaseDatasetConfig(phaseSlot);
		return {
			cityA: datasetConfig.cityA,
			cityB: datasetConfig.cityB
		};
	}

	function getPhaseCityColors(phaseSlot) {
		const datasetConfig = getPhaseDatasetConfig(phaseSlot);
		return {
			cityA: datasetConfig.colors.cityA,
			cityB: datasetConfig.colors.cityB
		};
	}

	function escapeHtml(value) {
		return String(value ?? '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function getPhaseOrganizationLabel(phaseSlot) {
		const datasetConfig = getPhaseDatasetConfig(phaseSlot);
		return datasetConfig.organization || getDefaultOrganizationForPhaseSlot(phaseSlot);
	}

	function getOrganizationBadgeHtml(organizationLabel) {
		return `<span class="organization-badge">${escapeHtml(organizationLabel)}</span>`;
	}

	function getPhaseOrganizationBadgeHtml(phaseSlot) {
		return getOrganizationBadgeHtml(getPhaseOrganizationLabel(phaseSlot));
	}

	function replaceCityNames(text, cityA, cityB) {
		return String(text || '')
			.replace(/\bCity A\b/g, cityA)
			.replace(/\bCity B\b/g, cityB);
	}

	function getPhaseQuestionText(phaseSlot) {
		const cityLabels = getPhaseCityLabels(phaseSlot);
		return replaceCityNames(window.ExperimentConfig.predictionTask.question, cityLabels.cityA, cityLabels.cityB);
	}

	function getPhaseTravelQuestionText(phaseSlot) {
		const cityLabels = getPhaseCityLabels(phaseSlot);
		return replaceCityNames(window.ExperimentConfig.predictionTask.travelQuestion, cityLabels.cityA, cityLabels.cityB);
	}

	function getPhaseTravelChoices(phaseSlot) {
		const cityLabels = getPhaseCityLabels(phaseSlot);
		return window.ExperimentConfig.predictionTask.travelChoices.map((choice) => {
			return replaceCityNames(choice, cityLabels.cityA, cityLabels.cityB);
		});
	}

	function getPhaseMetadataForSlot(phaseSlot) {
		const phaseKey = getPhaseKeyForSlot(phaseSlot);
		const phaseCondition = getPhaseConditionForSlot(phaseSlot);
		const phaseNumber = Number.parseInt(String(phaseKey).replace('phase', ''), 10) || phaseSlot;

		return {
			phaseSlot,
			phaseKey,
			phaseNumber,
			conditionId: phaseCondition ? phaseCondition.id : null,
			conditionName: phaseCondition ? phaseCondition.name : null,
			displayFormat: phaseCondition ? phaseCondition.displayFormat : null,
			technique: phaseCondition ? phaseCondition.technique : null
		};
	}

	function getPhaseTrialData(trialType, phaseSlot, extraData = {}) {
		const phaseMetadata = getPhaseMetadataForSlot(phaseSlot);
		const phaseDataset = getPhaseDatasetConfig(phaseSlot);
		return {
			trial_type: trialType,
			phase_slot: phaseMetadata.phaseSlot,
			phase_key: phaseMetadata.phaseKey,
			phase_number: phaseMetadata.phaseNumber,
			condition_id: phaseMetadata.conditionId,
			condition_name: phaseMetadata.conditionName,
			display_format: phaseMetadata.displayFormat,
			visualization_technique: phaseMetadata.technique,
			phase_dataset_file: phaseDataset.file,
			forecast_organization: phaseDataset.organization,
			city_a_label: phaseDataset.cityA,
			city_b_label: phaseDataset.cityB,
			city_a_color: phaseDataset.colors.cityA,
			city_b_color: phaseDataset.colors.cityB,
			...extraData
		};
	}

	function markPhaseCompleted(phaseSlot) {
		const phaseKey = getPhaseKeyForSlot(phaseSlot);
		if (!window.ParticipantConfig.phaseCompletion) {
			window.ParticipantConfig.phaseCompletion = {};
		}
		window.ParticipantConfig.phaseCompletion[phaseKey] = true;

		if (phaseKey === 'phase1') window.ParticipantConfig.phase1Complete = true;
		if (phaseKey === 'phase2') window.ParticipantConfig.phase2Complete = true;
		if (phaseKey === 'phase3') window.ParticipantConfig.phase3Complete = true;
		if (phaseKey === 'phase4') window.ParticipantConfig.phase4Complete = true;
	}

	function appendWithinParticipantPhase(phaseSlot) {
		const phaseCityLabels = getPhaseCityLabels(phaseSlot);
		const phaseOrganization = getPhaseOrganizationLabel(phaseSlot);
		const phaseOrganizationBadge = getPhaseOrganizationBadgeHtml(phaseSlot);

		timeline.push({
			type: jsPsychHtmlButtonResponse,
			stimulus: `
				<div class="phase-intro">
					<h2>Forecast Round ${phaseSlot}</h2>
					<p>You will be comparing <strong>${escapeHtml(phaseCityLabels.cityA)}</strong> and <strong>${escapeHtml(phaseCityLabels.cityB)}</strong>.</p>
					<p>The prediction is provided by ${phaseOrganizationBadge}.</p>
				</div>
			`,
			choices: [`Start Forecast Round ${phaseSlot}`],
			data: function() {
				return getPhaseTrialData('forecast_round_intro', phaseSlot, { round: 1 });
			}
		});

		timeline.push({
			type: window.jsPsychPredictionTask,
			phase: phaseSlot,
			round: 1,
			show_visualization: true,
			show_predictions: true,
			forecast_organization: phaseOrganization,
			visualization_condition: function () {
				return getPhaseConditionForSlot(phaseSlot);
			},
			air_quality_data: async function () {
				return await getAirQualityData(phaseSlot);
			},
			question: getPhaseQuestionText(phaseSlot),
			confidence_scale: window.ExperimentConfig.predictionTask.confidenceScale,
			travel_question: getPhaseTravelQuestionText(phaseSlot),
			travel_choices: getPhaseTravelChoices(phaseSlot),
			city_labels: getPhaseCityLabels(phaseSlot),
			city_colors: getPhaseCityColors(phaseSlot),
			data: function() {
				return getPhaseTrialData('phase_prediction', phaseSlot, {
					round: 1,
					visualization_shown: true,
					predictions_shown: true
				});
			},
			on_finish: function () {
				markPhaseCompleted(phaseSlot);
			}
		});

		timeline.push({
			type: window.jsPsychInteractionFeedback,
			preamble: `
				<div class="interaction-feedback-preamble">
					<h3>Interaction Feedback</h3>
					<p>Please share your feedback about the interaction you just experienced for ${phaseOrganizationBadge}.</p>
				</div>
			`,
			data: function() {
				return getPhaseTrialData('interaction_feedback', phaseSlot, { round: 1 });
			}
		});

		timeline.push({
			type: jsPsychTrustSurvey,
			questions: [
				...window.ExperimentConfig.visualizationTrustQuestions,
				...window.ExperimentConfig.interactionQuestions
			],
			preamble: `
                <div class="trust-survey-preamble">
                    <h3>Trust and Interaction Questions</h3>
					<p>Please answer these questions for the forecast from ${phaseOrganizationBadge}.</p>
                </div>
            `,
			data: function() {
				return getPhaseTrialData('trust_survey_combined', phaseSlot, { round: 1 });
			},
			on_finish: function (data) {
				// Convert 0-based to 1-7 scale indexing and rename response fields for consistency
				data.skeptical_rating = data.response.skeptical_rating !== null ? data.response.skeptical_rating + 1 : null;
				data.data_trust = data.response.data_trust !== null ? data.response.data_trust + 1 : null;
				data.usability_difficulty = data.response.usability_difficulty !== null ? data.response.usability_difficulty + 1 : null;
				data.comprehension_ease = data.response.comprehension_ease !== null ? data.response.comprehension_ease + 1 : null;

				// Calculate composite metrics
				data.trust_composite = data.data_trust !== null ? data.data_trust : null;
				data.usability_composite = data.usability_difficulty && data.comprehension_ease ?
					Math.round((data.comprehension_ease + (8 - data.usability_difficulty)) / 2) : null;
			}
		});
		}

	for (let phaseSlot = 1; phaseSlot <= 4; phaseSlot += 1) {
		appendWithinParticipantPhase(phaseSlot);
	}

	// Demographics Introduction
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
					phase_execution_order: window.ParticipantConfig.phaseExecutionOrder || null,
					phase_assignment_log: window.ParticipantConfig.phaseAssignmentLog || null
				};
			}
		});

	// Age and Major Questions (Text Input)
	timeline.push({
		type: jsPsychSurveyText,
		questions: [
			{
				prompt: "What is your age?",
				name: 'age',
				required: true,
				columns: 5,
				input_type: 'number'
			},
			{
				prompt: "What is your major/field of work?",
				name: 'major_field',
				required: true,
				columns: 40
			}
		],
			data: function() {
				return {
					trial_type: 'demographics_text_1',
					phase_execution_order: window.ParticipantConfig.phaseExecutionOrder || null,
					phase_assignment_log: window.ParticipantConfig.phaseAssignmentLog || null
				};
			}
		});

	// Education and Visualization Experience (Multiple Choice)
	timeline.push({
		type: jsPsychSurveyMultiChoice,
		questions: [
			{
				prompt: "What is your highest level of education?",
				name: 'education',
				required: true,
				options: ['High school or equivalent', 'Some college', 'Associate degree', 'Bachelor\'s degree', 'Master\'s degree', 'Doctoral degree', 'Other']
			},
			{
				prompt: "How often do you work with data visualizations or charts?",
				name: 'viz_experience',
				required: true,
				options: ['Daily', 'Weekly', 'Monthly', 'A few times per year', 'Rarely', 'Never']
			}
		],
			data: function() {
				return {
					trial_type: 'demographics_mc',
					phase_execution_order: window.ParticipantConfig.phaseExecutionOrder || null,
					phase_assignment_log: window.ParticipantConfig.phaseAssignmentLog || null
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
		                <p>You completed one baseline forecast round and three additional visualization forecast rounds in a predefined version-specific order. The goal is to understand which formats help people make better decisions and maintain appropriate trust in prediction systems.</p>
                
                <p>The Humidity data you saw was synthetic (computer-generated) for research purposes.</p>
                <p>Some conditions may have display glitches. They are intentionally designed to evaluate how people interpret those display bugs.</p>
                
                <h3>Questions?</h3>
                <p>If you have questions about this research, please contact the research team.</p>
                
                <p>Your participation contributes to understanding how to design better prediction visualizations for real-world applications like weather forecasting, financial predictions, and public health data.</p>
            </div>
        `,
		choices: ['Close Study'],
		data: { trial_type: 'debrief' },
			on_finish: function() {
				// Securely validate completion and get redirect URL from server
				const completionData = {
					study_complete: true,
					phase1_complete: window.ParticipantConfig.phase1Complete,
					phase2_complete: window.ParticipantConfig.phase2Complete,
					phase3_complete: window.ParticipantConfig.phase3Complete,
					phase4_complete: window.ParticipantConfig.phase4Complete,
					phase_completion: window.ParticipantConfig.phaseCompletion || null,
					phase_execution_order: window.ParticipantConfig.phaseExecutionOrder || null,
					end_time: new Date().toISOString()
				};

			
			fetch('/complete_study.php', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(completionData)
			})
			.then(response => {
				return response.json();
			})
			.then(data => {
				if (data.success) {
					// Redirect to Prolific completion page
					window.location.href = data.redirect_url;
				} else {
					console.error('Study completion validation failed:', data.error);
					alert('There was an error completing your study. Please contact the research team.');
				}
			})
			.catch(error => {
				console.error('Error validating study completion:', error);
				alert('There was an error completing your study. Please contact the research team.');
			});
		}
	});
}

// Helper Functions

function getDefaultOrganizationForPhaseSlot(phaseSlot) {
	return defaultOrganizationLabelsBySlot[phaseSlot - 1] || `Organization ${phaseSlot}`;
}


function resolveDatasetConfigForPhase(phaseSlot) {
	const datasets = window.ExperimentConfig?.phaseDatasets || {};
	const phaseKey = `phase${phaseSlot}`;
	const configured = datasets[phaseKey];
	const fallbackOrganization = getDefaultOrganizationForPhaseSlot(phaseSlot);

	if (!configured || !configured.file) {
		return {
			...defaultPhaseDatasetConfig,
			organization: fallbackOrganization,
			colors: { ...defaultPhaseDatasetConfig.colors }
		};
	}

	return {
		file: configured.file,
		organization: configured.organization || fallbackOrganization,
		cityA: configured.cityA || defaultPhaseDatasetConfig.cityA,
		cityB: configured.cityB || defaultPhaseDatasetConfig.cityB,
		colors: {
			cityA: configured.colors?.cityA || defaultPhaseDatasetConfig.colors.cityA,
			cityB: configured.colors?.cityB || defaultPhaseDatasetConfig.colors.cityB
		}
	};
}

function normalizePhaseDatasetRows(rawRows, datasetConfig) {
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

	const fallbackCityA = observedNames[0] || datasetConfig.cityA || defaultPhaseDatasetConfig.cityA;
	const fallbackCityB = observedNames[1] || datasetConfig.cityB || defaultPhaseDatasetConfig.cityB;

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
			`Normalized dataset must include two mapped city series (A and B). Found: ${Array.from(mappedStocks).join(', ')}`
		);
	}

	return normalizedRows;
}

// Get Humidity data for a specific phase.
async function getAirQualityData(phaseSlot = 1) {
	const datasetConfig = resolveDatasetConfigForPhase(phaseSlot);
	const cacheKey = `${phaseSlot}:${datasetConfig.file}`;
	if (airQualityDataCache.has(cacheKey)) {
		return airQualityDataCache.get(cacheKey);
	}

	try {
		const candidatePaths = new Set();
		const fileName = String(datasetConfig.file || '').trim();
		const baseCandidates = fileName.includes('/')
			? [fileName]
			: [`generated/${fileName}`, `/${fileName}`, `/generated/${fileName}`, fileName];
		const prefixes = ['', '../', '../../', '../../../'];
		prefixes.forEach((prefix) => {
			baseCandidates.forEach((candidate) => {
				candidatePaths.add(`${prefix}${candidate}`);
			});
		});
		const attemptedErrors = [];

		for (const path of candidatePaths) {
			try {
				const response = await fetch(path, { cache: 'no-store' });
				if (!response.ok) {
					attemptedErrors.push(`${path} -> HTTP ${response.status}`);
					continue;
				}

				const responseText = await response.text();
				const trimmed = responseText.trim();
				if (!trimmed) {
					attemptedErrors.push(`${path} -> empty response body`);
					continue;
				}

				const contentType = (response.headers.get('content-type') || '').toLowerCase();
				if (contentType.includes('text/html') || trimmed.startsWith('<')) {
					attemptedErrors.push(`${path} -> received HTML instead of JSON`);
					continue;
				}

				let parsed;
				try {
					parsed = JSON.parse(responseText);
				} catch (parseError) {
					attemptedErrors.push(`${path} -> invalid JSON (${parseError.message})`);
					continue;
				}

				const rows = Array.isArray(parsed) ? parsed : parsed?.data;
				if (!Array.isArray(rows)) {
					attemptedErrors.push(`${path} -> JSON missing data array`);
					continue;
				}

				const normalizedRows = normalizePhaseDatasetRows(rows, datasetConfig);
				airQualityDataCache.set(cacheKey, normalizedRows);
				return normalizedRows;
			} catch (error) {
				attemptedErrors.push(`${path} -> ${error.message}`);
			}
		}

		const summarizedErrors = attemptedErrors.slice(0, 6).join(' | ');
		throw new Error(
			`Failed to load dataset for phase ${phaseSlot}. Tried ${candidatePaths.size} paths. ` +
			(summarizedErrors || 'No successful JSON response.')
		);
	} catch (error) {
		console.error(`Error loading Humidity data for phase ${phaseSlot}:`, error);
		throw new Error(`Failed to load required phase dataset: ${error.message}`);
	}
}

// Save data function
function saveData(data) {
	const allData = data.values();

	// Add participant summary
	const summary = {
		participant_id: window.ParticipantConfig.id,
		condition: window.ParticipantConfig.assignedCondition, // Backward-compatible alias (phase2 canonical condition)
		phase_assignment_log: window.ParticipantConfig.phaseAssignmentLog || null,
		phase_execution_order: window.ParticipantConfig.phaseExecutionOrder || null,
		phase_completion: window.ParticipantConfig.phaseCompletion || null,
		version_descriptor: window.ParticipantConfig.versionDescriptor || null,
		version: window.ParticipantConfig.version || null,
		start_time: window.ParticipantConfig.startTime,
		end_time: new Date().toISOString(),
		visualization_literacy_score: window.ParticipantConfig.visualizationLiteracyScore,
		phase1_complete: window.ParticipantConfig.phase1Complete,
		phase2_complete: window.ParticipantConfig.phase2Complete,
		phase3_complete: window.ParticipantConfig.phase3Complete,
		phase4_complete: window.ParticipantConfig.phase4Complete
	};

	if (window.ExperimentConfig.dataCollection.saveToServer) {
		// Convert data to CSV format for PHP script
		const csvData = convertToCSV(allData, summary);
		
		// Generate filename in format required by PHP: user_[ID]_[TIMESTAMP].csv
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('Z', '').split('.')[0]; // Remove Z and milliseconds
		const participantIdClean = window.ParticipantConfig.id || 'unknown'; // Handle null case
		const participantIdNumber = participantIdClean.toString().replace(/^P/, ''); // Remove 'P' prefix if present
		const numericId = participantIdNumber.replace(/[^0-9]/g, '') || Date.now(); // Extract only digits, fallback to timestamp
		const filename = `user_${numericId}_${timestamp}.csv`;

		// Send to PHP server in expected format
		fetch(window.ExperimentConfig.dataCollection.serverEndpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ 
				filedata: csvData, 
				filename: filename 
			})
		}).then(response => {
			if (!response.ok) {
				throw new Error(`Server error: ${response.status}`);
			}
			return response.json();
		}).then(() => {
		}).catch(error => {
			console.error('Error saving to server, using localStorage fallback:', error);
			// Fallback to local storage
			localStorage.setItem(`air_quality_study_${window.ParticipantConfig.id}`, JSON.stringify({ data: allData, summary }));
		});
	} else {
		// Save to local storage
		localStorage.setItem(`air_quality_study_${window.ParticipantConfig.id}`, JSON.stringify({ data: allData, summary }));
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
