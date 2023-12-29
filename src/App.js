import './App.css';
import React, {useEffect} from "react";
import CodeMirror from '@uiw/react-codemirror';
import {javascript} from '@codemirror/lang-javascript';
import {cpp} from "@codemirror/lang-cpp";
import {java} from "@codemirror/lang-java";
import {php} from "@codemirror/lang-php";
import {python} from "@codemirror/lang-python"
import {vscodeDark} from "@uiw/codemirror-theme-vscode";
import Select from 'react-select';
import axios from "axios";
import {MergeView} from "@codemirror/merge";


const options = [
	{label: 'Javascript', value: 'js'},
	{label: 'C++', value: 'cpp'},
	{label: 'Java', value: 'java'},
	{label: 'PHP', value: 'php'},
	{label: 'Python', value: 'python'},
];

const langObject = {
	js: [javascript({jsx: true})],
	cpp: [cpp()],
	java: [java()],
	php: [php()],
	python: [python()]
}

function App() {
	const [value, setValue] = React.useState("");
	const [langValue, setLangValue] = React.useState('')
	const [taskText, setTaskText] = React.useState('')

	const [response, setResponse] = React.useState('')
	const [isLoading, setLoading] = React.useState(false)
	const [points, setPoints] = React.useState([5, 30])

	const mergeViewRef = React.useRef();

	const [mergeView, setMergeView] = React.useState();


	React.useEffect(() => {
		return () => {
			mergeView?.destroy();
		};
	}, [mergeView]);

	if(!localStorage.getItem("apikey")) {
		const apikey = prompt('Write Gpt api key')
		localStorage.setItem("apikey", apikey)
	}


	function returnPrompt(lang, task, solution) {
		const prompt = `
	As a university teacher specializing in the ${lang} programming language, you assigned your students a task: ${task}.
	One student submitted the following solution: ${solution}. 
	Please analyze the task and the student's solution, then provide feedback in JSON format.
	The JSON object should contain three variables: a grade from 1 to 100 (lower the grade for any syntax errors by ${points[0]} and lower the grade for wrong code output by ${points[1]}),
	the output of the code (if the code includes a function, provide the function's output), 
	and the corrected code if necessary, the corrected code structure should look similar to student's code structure.
	Also, corrected code shouldn't be written in one string.
	Remember, the response should be a valid JSON object that won't produce an error during JSON.parse.
	For instance, a valid response would look like this: {"grade":"80","output":"hello world", "corrected":"console.log('hello world')"}.
	Note: Ensure that the 'grade', 'output', and 'corrected' variables are all string types. 
	Please do not include any additional explanations; only the JSON object is required.
	`

		return prompt
	}

	const generateText = async () => {
		if(!localStorage.getItem("apikey")) {
			alert('You didnt provide the api key')
			return
		}
		setLoading(true)
		axios({
			method: "POST",
			url: "https://api.openai.com/v1/chat/completions",
			data: {
				messages: [{"role": "user", "content": returnPrompt(langValue.label, taskText, value)}],
				model: 'gpt-4'
			},
			headers: {
				"Content-Type": "application/json",
				Authorization:
					`Bearer ${localStorage.getItem("apikey")}`
			}
		})
			.then((res) => {
				setLoading(false)
				console.log(res.data.choices[0].message.content)
				setResponse(JSON.parse(res.data.choices[0].message.content));
				console.log(JSON.parse(res.data.choices[0].message.content).corrected)
				const view = new MergeView({
					a: {
						doc: value,
					},
					b: {
						doc: JSON.parse(res.data.choices[0].message.content).corrected
					},
					parent: mergeViewRef.current
				});

				setMergeView(view);
			})
			.catch((e) => {
				console.log(e.message, e);
				setLoading(false)
			});
	};

	const onChange = React.useCallback((val, viewUpdate) => {
		setValue(val);
	}, []);

	const handleChange = (selectedOption) => {
		setLangValue(selectedOption)
	};

	function setApiKey() {
		const apikey = prompt('Write Gpt api key')
		localStorage.setItem("apikey", apikey)
	}

	return (
		<section>
			<div className='sides' style={{display: response === '' ? 'flex' : 'none'}}>
				<h1>Teacher's side</h1>
				<h2>Select programming language:</h2>
				<Select
					value={langValue}
					onChange={handleChange}
					options={options}
					width={'300px'}
				/>
				<h2>Write task:</h2>
				<textarea value={taskText} onChange={(e) => {setTaskText(e.target.value)} } name="" id="" cols="30" rows="10"></textarea>
				<h2>Decrease points:</h2>
				<div id='pointsDecreaser'>
					<span>Decrease grade for syntax errors by</span>
					<input type="number" value={points[0]} onChange={(e) => {setPoints([Number(e.target.value), points[1]])}}/>
					<span>points</span>
				</div>
				<div id='pointsDecreaser'>
					<span>Decrease grade for wrong output by</span>
					<input type="number" value={points[1]} onChange={(e) => {setPoints([points[0], Number(e.target.value)])}}/>
					<span>points</span>
				</div>
				<button className='submitCode changeApi' onClick={setApiKey} type="button">Change api key</button>
			</div>
			<div className="sides" style={{display: response === '' ? 'none' : 'block'}}>
				<h2 style={{width: '80%', marginTop: '70px'}}>
					Grade: {response.grade} / 100
				</h2>
				<h2 style={{width: '80%', marginTop: '70px'}}>
					Result: {response.output}
				</h2>
				<button className='submitCode' onClick={() => {
					setResponse('')
					setMergeView(null)
				}
				}>OK</button>
			</div>
			<div className='sides'>
				<h1>Student's side</h1>
				<span className='editorTitles'>
					{mergeView ? <><h2>Student's code</h2> <h2>Corrected code</h2></> : <h2>Student's code</h2> }
				</span>
				<span className={'editors'}>
					<CodeMirror className={mergeView ? 'hidden' : ''} value={value} theme={vscodeDark} height="500px" width='calc(65vw - 1.5px)'
					                              extensions={langObject[langValue.value]} onChange={onChange}/>
				</span>
				<span ref={mergeViewRef}>

				</span>
				{mergeView ?
					'' :
					<button
						onClick={generateText}
						className={langValue ? 'submitCode' : 'submitCode disabled'}
					>
						{isLoading ? "Loading..." : 'Submit'}
					</button>
				}

			</div>
		</section>
	);
}

export default App;
