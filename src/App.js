import './App.css';
import React from "react";
import CodeMirror from '@uiw/react-codemirror';
import {javascript} from '@codemirror/lang-javascript';
import {cpp} from "@codemirror/lang-cpp";
import {java} from "@codemirror/lang-java";
import {php} from "@codemirror/lang-php";
import {python} from "@codemirror/lang-python"
import {vscodeDark} from "@uiw/codemirror-theme-vscode";
import Select from 'react-select';
import axios from "axios";


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

function returnPrompt(lang, task, solution) {
	const prompt = `
	  As the ${lang} university teacher, you gave your student this task on ${lang} programming language: ${task}
    Your student came up with this solution of the task:
    ${solution}
    Please, analyze the task and student's solution of this task. Then, return the results in JSON format.
    In JSON there should be object with 3 variables.
    First one is your grade on scale from 1 to 100,
    Second one is output of this code (if there is one function - return the output of the function), Third one is corrected code.
    REMEMBER - YOU WILL WRITE ME BACK ONLY A VALID JSON OBJECT, SO IT WILL NOT GIVE ME AN ERROR WHEN I'LL DO JSON.parse().
    HERE'S THE EXAMPLE OF JSON OBJECT THAT YOU WILL GIVE ME: {"grade":"80","output":"hello world", "corrected":"
	    console.log('hello world')
	    console.log('hi')
    "}. 
    DO NOT INCLUDE ANY EXPLANATIONS.
    Grade, output and corrected variables should be a string type.`

  return prompt
}

function App() {
	const [value, setValue] = React.useState("");
	const [langValue, setLangValue] = React.useState('')
	const [taskText, setTaskText] = React.useState('')

	const [response, setResponse] = React.useState('')
	const [isLoading, setLoading] = React.useState(false)

	if(!localStorage.getItem("apikey")) {
		const apikey = prompt('Write Gpt api key')
		localStorage.setItem("apikey", apikey)
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
				setResponse(JSON.parse(res.data.choices[0].message.content));
				console.log(res.data.choices[0].message.content)
				console.log(JSON.parse(res.data.choices[0].message.content))
				setLoading(false)
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
		console.log(selectedOption)
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
				<button className='submitCode' onClick={setApiKey} type="button">Change api key</button>
				{/*<h2>Write starting code</h2>*/}
				{/*<CodeMirror theme={vscodeDark} height="200px" width='calc(50vw - 1.5px)'*/}
				{/*            extensions={langObject[langValue.value]} onChange={(val) => {*/}
				{/*	setValue(val)*/}
				{/*}}/>*/}
				{/*<button className='submitCode'>Save</button>*/}
			</div>
			<div className="sides" style={{display: response === '' ? 'none' : 'block'}}>
				<h2 style={{width: '80%', marginTop: '70px'}}>
					Grade: {response.grade} / 100
				</h2>
				<h2 style={{width: '80%', marginTop: '70px'}}>
					Result: {response.output}
				</h2>
				<h2 style={{width: '80%', marginTop: '70px'}}>
					Corrected Code: {response.corrected}
				</h2>
				<button className='submitCode' onClick={() => {setResponse('')}}>OK</button>
			</div>
			<div className='sides'>
				<h1>Student's side</h1>
				<CodeMirror value={value} theme={vscodeDark} height="500px" width='calc(50vw - 1.5px)'
				            extensions={langObject[langValue.value]} onChange={onChange}/>
				<button 
					onClick={generateText} 
					className={langValue ? 'submitCode' : 'submitCode disabled'}
					>
					{isLoading ? "Loading..." : 'Submit'}
				</button>
			</div>
		</section>
	);
}

export default App;
