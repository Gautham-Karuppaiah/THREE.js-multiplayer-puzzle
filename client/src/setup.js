import { loadMeshes } from './loader.js'

export async function setupUI(onStart) {
    const setupScreen = document.getElementById('setup-screen')
    const puzzleCanvas = document.getElementById('puzzle-canvas')
    const imagePicker = document.getElementById('image-picker')
    const colsInput = document.getElementById('cols-input')
    const rowsInput = document.getElementById('rows-input')
    const startButton = document.getElementById('start-button')
    
    imagePicker.value = '' //clears  file input on load
    
    let selectedFile = null
    
    await loadMeshes() //wait for meshes to load before letting button be enabled 
    
    imagePicker.addEventListener('change', (event) => {//sets up event listener listening for change in button indicated file has been uploaded
        if (event.target.files.length > 0) { 
            selectedFile = event.target.files[0]
            console.log(selectedFile)
            startButton.disabled = false  //enables button 
        }
    })
    
    startButton.addEventListener('click', () => { //adds event listener listening on values being entered or selected in the col and row selection boxes 
        const cols = parseInt(colsInput.value)
        const rows = parseInt(rowsInput.value)
        
        setupScreen.classList.add('hidden') //hides setup screen. maybe shouldnt do it before loading in the scene but this probably feels more responsive
        puzzleCanvas.classList.remove('hidden') //displays puzzle screen 
        
        onStart(selectedFile, cols, rows)  //calls the function that sets everythingup
    })
}
