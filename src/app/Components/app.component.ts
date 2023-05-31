import { AfterViewInit, Component } from '@angular/core';
import { Chart } from 'chart.js';
import { getConfigs, getTension } from './Common/Configs.chart';
import { InterpolationapiService } from './Service/interpolationapi.service';
import { Request } from './Service/interface/request';
import { Response } from './Service/interface/response';
import Swal from 'sweetalert2';

let globalXValues:number[] = new Array();
let globalYValues:number[] = new Array();
let toInterpolateValues:number[] = new Array();

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {

  selectedOption: string = 'Seleccionar orden [X, Fn(X)]';
  filteredData: number[][] = [];
  options:string[] = [];

  tableData: any[] = [];
  arregloDividido:number[][][] = [];

  resultData: Response = {
    interpolatedData: [],
    piramyd:[]
  };

  constructor(private $service:InterpolationapiService) {/* Void constructor */ }

  ngAfterViewInit(): void {

    let inputContainer: HTMLElement = document.getElementById('dataBodyOne')!;
    this.createNewInputs(inputContainer);

    /*+ ------------------------------ | All Keys listeners | ------------------------------- +*/

    document.addEventListener('keydown', event => {

      /*+ -------------------------- | Key listener (ctrl+enter) | -------------------------- +*/

      if (event.ctrlKey && event.key === 'Enter') {

        let inputContainer: HTMLElement = document.getElementById('dataBodyOne')!;
        let title: HTMLElement = document.querySelector('#titleInterpolated')!;

        this.renovateRender(title, inputContainer);

      }

      /*+ -------------------------- | Key listener (ctrl+q) | -------------------------- +*/

      if (event.ctrlKey && event.key === 'q') {
        this.removeInputs(false);
        document.querySelector('#titleInterpolated')!.innerHTML = 'Valores [X,Y] iniciales'
        globalXValues=[]
        globalYValues=[]
        toInterpolateValues=[]
      }

      /*+ -------------------------- | Key listener (ctrl+y) | -------------------------- +*/

      if (event.ctrlKey && event.key === 'y') {
        let modal: HTMLElement = document.getElementById('myModal')!;
        modal.style.display = (modal.style.display === "block") ? "none" : "block";
      }

    });

  }

  getNumeroDeOrden(order:string): number {
    const numeroOrden = parseInt(order.split('-')[1]);
    return numeroOrden;
  }

  generateFilteredData() {
    if (this.selectedOption !== '' && this.selectedOption !== 'Seleccionar orden [X, Fn(X)]') {
      this.filteredData = this.resultData.interpolatedData[this.getNumeroDeOrden(this.selectedOption)-1]
    } else {
      this.filteredData = [];
    }
  }

  checkInputs(inputContainer: HTMLElement): void {

    let inputs: HTMLCollectionOf<HTMLInputElement> = inputContainer.getElementsByTagName('input');
    let lastInput: HTMLInputElement = inputs[inputs.length - 1];
    let penultimateInput: HTMLInputElement = inputs[inputs.length - 2];

    if (inputs.length >= 2 && lastInput.value.trim() !== '' && penultimateInput.value.trim() !== '') {
      this.createNewInputs(inputContainer);
    }

  }

  createNewInputs(inputContainer: HTMLElement): void {

    let inputs: HTMLCollectionOf<HTMLInputElement> = inputContainer.getElementsByTagName('input');

    let x_input: HTMLInputElement = document.createElement('input');
    x_input.classList.add("x_value");
    x_input.placeholder = "X";

    let y_input: HTMLInputElement = document.createElement('input');
    y_input.classList.add("y_value");
    y_input.placeholder = "Y";

    let deleteButton: HTMLButtonElement = document.createElement('button');
    deleteButton.classList.add("delBtn");
    deleteButton.innerHTML = 'X';

    inputContainer.appendChild(x_input);
    inputContainer.appendChild(y_input);
    y_input.appendChild(deleteButton);

    x_input.addEventListener('input', () => {
      this.checkInputs(inputContainer);
    });
    y_input.addEventListener('input', () => {
      this.checkInputs(inputContainer);
    });

    if (inputs.length > 2) {

      x_input.addEventListener('click', function(event) {
        if (event.ctrlKey) {
          x_input.remove();
          y_input.remove();
        }
      });

      y_input.addEventListener('click', function(event) {
        if (event.ctrlKey) {
          x_input.remove();
          y_input.remove();
        }
      });

    }

  }

  /*+ -------------------------- | Values from inputs | -------------------------- +*/

  getValues = (inputs: NodeListOf<Element>): number[] => {

    let returnValues: number[] = [];

    inputs.forEach((input: Element) => {

      let transformInput = input as HTMLInputElement;
      const value = transformInput.value.trim();

      if ( value !== '') {
        returnValues.push(
          (value.includes('.'))?parseFloat(value):parseInt(value)
        );
      }

    });

    return returnValues;

  }

  /*+ -------------------------- | Remove all inputs | -------------------------- +*/

  removeInputs = (all:boolean) => {

    let inputContainer: HTMLElement = document.getElementById('dataBodyOne')!;

    // Obtén todos los inputs dentro del div
    const inputs = inputContainer.querySelectorAll('input');

    // Vacía el valor de los primeros dos inputs
    inputs[0].value = '';
    inputs[1].value = '';

    if(all){
      inputs[0].style.display = 'none';
      inputs[1].style.display = 'none';
    }else{
      inputs[0].style.display = 'inline-block';
      inputs[1].style.display = 'inline-block';
    }

    for (let i = 2; i < inputs.length; i++) {
      inputs[i].remove();
    }

  }

  /* + ------------------------| Create a interpolate x value inputs |------------------------ + */

  checkInterpolatesInputs=(inputContainer: HTMLElement): void=> {

    let inputs: HTMLCollectionOf<HTMLInputElement> = inputContainer.getElementsByTagName('input');
    let lastInput: HTMLInputElement = inputs[inputs.length - 1];

    if (inputs.length >= 1 && lastInput.value.trim()) {
      this.createNewInputsInterpolate(inputContainer);
    }

  }

  createNewInputsInterpolate=(inputContainer: HTMLElement): void=> {

    let inputs: HTMLCollectionOf<HTMLInputElement> = inputContainer.getElementsByTagName('input');

    let x_input: HTMLInputElement = document.createElement('input');
    x_input.classList.add("x_value_toInterpolate");
    x_input.placeholder = "X a interpolar";

    inputContainer.appendChild(x_input);

    x_input.addEventListener('input', () => {
      this.checkInterpolatesInputs(inputContainer)
    });

    if (inputs.length > 3) {
      x_input.addEventListener('click', function(event) {
        if (event.ctrlKey) {
          x_input.remove();
        }
      })
    }

  }

  /* + ------------------------| Renovate views rendered |------------------------ + */

  renovateRender=(title:HTMLElement, inputContainer:HTMLElement):void => {

    if(title.innerHTML=='Valores [X,Y] iniciales'){

      let x_inputs: NodeListOf<Element> = document.querySelectorAll(".x_value");
      globalXValues = this.getValues(x_inputs);

      let y_inputs: NodeListOf<Element> = document.querySelectorAll(".y_value");
      globalYValues = this.getValues(y_inputs);

      title.innerHTML = 'Valores a interpolar'
      this.removeInputs(true);
      this.createNewInputsInterpolate(inputContainer);

    }else{

      let x_iterpolates_inputs: NodeListOf<Element> = document.querySelectorAll(".x_value_toInterpolate");
      toInterpolateValues = this.getValues(x_iterpolates_inputs);

      title.innerHTML = 'Valores [X,Y] iniciales'
      this.makeAllRequest();
      this.removeInputs(false);

    }

  };

  /* + ------------------------| Send procesed data and make sweetalerts |------------------------ + */
  makeAllRequest=()=>{

    this.options = []

    Swal.fire({

      title: '¿Necesitas que se agreguen los datos consecutivos en el arreglo?',
      text: "(No recomendado para conjunto de datos grandes)",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, añadelos!'

    }).then((result) => {

      globalXValues = [500, 700, 900, 1100, 1300, 1500, 1700, 1900];
      globalYValues = [365, 361.6, 370.64, 379.68, 384.46, 395.5, 395.95, 397];
      toInterpolateValues = [500, 700, 900, 1000, 1100, 1300, 1500, 1700, 1900];

      // Combinar los dos arrays y eliminar duplicados
      const mergedArray = [...new Set([...globalXValues, ...toInterpolateValues])];
      // Ordenar el array resultante
      const sortedArray = mergedArray.slice().sort((a, b) => a - b);

      if (result.isConfirmed) {

        Swal.fire(
          'Se han añadido!',
          'El arreglo de (x) a interpolar se relleno',
          'success'
        ).then(()=>{
          this.makeSuccessAlertAndSendData(sortedArray, true)
        })

      }else{

        Swal.fire({

          title: '¿Quieres que los datos a interpolar sean las x?',
          text: "Se tomara el arreglo de x que se puso al inicio",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Si, solo esos!'

        }).then((result)=>{

          if(result.isConfirmed){
            this.makeSuccessAlertAndSendData(globalXValues, false)
          }else{
            this.makeSuccessAlertAndSendData(sortedArray, false)
          }

        }).catch(e=>console.error(e))

      }

    })

  }/* Remember */

  makeSuccessAlertAndSendData(sortedArray: number[], fillSpaces: boolean):void{

    Swal.fire({
      position: 'top-end',
      icon: 'success',
      title: 'Peticion realizada',
      showConfirmButton: false,
      timer: 1500
    }).then(()=>this.senDataToApi(sortedArray, fillSpaces))

  }

  fillOrNotArray(sortedArray:number[], fillSpaces: boolean):number[]{

    if(!fillSpaces){
      return sortedArray
    }

    // Crear un nuevo array con valores consecutivos
    const consecutiveArray = [];
    let previousValue = sortedArray[0];
    consecutiveArray.push(previousValue);

    for (let i = 1; i < sortedArray.length; i++) {

      const currentValue = sortedArray[i];
      const diff = currentValue - previousValue;

      if (diff > 1) {
        for (let j = 1; j < diff; j++) {

          const interpolatedValue = previousValue + j;

          if (Number.isInteger(interpolatedValue) || sortedArray.includes(interpolatedValue)) {
            consecutiveArray.push(interpolatedValue);
          }

        }
      }

      consecutiveArray.push(currentValue);
      previousValue = currentValue;

    }

    return consecutiveArray;

  }

  senDataToApi(sortedArray: number[], fillSpaces: boolean){

    let sendData:Request = {
      "xValues":globalXValues,
      "yValues":globalYValues,
      "toInterpolatedValues":this.fillOrNotArray(sortedArray, fillSpaces)
    }

    this.$service.getInterpolation(sendData).subscribe((dataR: Response) => {

      this.tableData = []
      this.arregloDividido = []
      let itr = 1;

      this.resultData = {
        interpolatedData: [],
        piramyd: []
      }

      this.resultData = dataR;

      dataR.interpolatedData.forEach((x, y) => {
        this.options.push(`Orden-${itr}`);
        itr += 1;
      });

      this.selectedOption = 'Orden-1'
      this.generateFilteredData()

      this.generateChart(dataR)

      let arregloNumerico  = this.gerNumbersFromStringArray(dataR.piramyd)
      let numberHigherArray = this.getHigher(arregloNumerico)!;

      this.arregloDividido = arregloNumerico.reduce((resultado: number[][][], elemento: number[]) => {

        const primerNumero: number = elemento[0];

        // Buscar el subarreglo correspondiente al primer número
        const subarreglo = resultado.find(arr => arr[0][0] === primerNumero);

        // Si el subarreglo existe, agregar el elemento actual
        if (subarreglo) {
          subarreglo.push(elemento);
        } else {
          // Si el subarreglo no existe, crear uno nuevo con el elemento actual
          resultado.push([elemento]);
        }

        return resultado;

      }, []);

      let invertedData = this.arregloDividido.map(subarray => subarray.reverse());

      for (let i = 0; i < globalXValues.length; i++) {

        const xi = globalXValues[i];
        const fxi = globalYValues[i];

        this.tableData.push({ xi:xi, fxi:fxi });

      }

    });

  }

  gerNumbersFromStringArray(arr: string[]): number[][] {

    const numeros: number[][] = [];

    for (const str of arr) {

      const match_1 = str.match(/Orden (\d+)/)!;
      const match_2 = str.match(/:\s*([-+]?\d*\.?\d+)/)!;

      if (match_1) {
        const numeroInt = parseInt(match_1[1], 10); // Convertir el número de cadena a entero
        const numeroFloat = parseFloat(match_2[1]); // Convertir el número de cadena a float
        numeros.push([numeroInt,numeroFloat]);
      }
    }

    return numeros;

  }

  getHigher(data: number[][]):number| undefined{

    let higher: number | undefined;

    for (const subarray of data) {
      const firstNumber = subarray[0];

      if (higher === undefined || firstNumber > higher) {
        higher = firstNumber;
      }

    }

    return higher;

  }

  generateChart(dataR: Response) {

    const chartContainer:HTMLElement = document.getElementById('chart')!;

    this.clearDataChart(chartContainer)

    const ctx: HTMLCanvasElement = document.createElement('canvas')!;
    ctx.classList.add('myChart')

    const response = dataR.interpolatedData.map(arr => arr.map(item => item[1]));

    const array: number[] = [];
    response.forEach(data => array.push(...data));

    let result = [];

    for (let i = 0; i < dataR.interpolatedData.length; i++) {
      response.forEach(array => array.unshift(NaN));
      result.push(i);
    }

    result.push(...dataR.interpolatedData[0].map(item => item[0]));

    const colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'cyan', 'magenta', 'lime', 'pink', 'teal', 'indigo', 'brown', 'silver', 'gold', 'olive', 'navy', 'maroon', 'aqua', 'coral'];

    const datasets = response.map((data, index) => ({
      label: `Orden ${index + 1}`,
      data: data,
      borderColor: colors[index % colors.length],
      fill: false,
      tension: getTension()
    }));

    const data = {
      labels: result,
      datasets: datasets
    };

    try {
      new Chart(ctx, getConfigs(data, array));
    } catch (e) {
      console.error(e);
    }

    chartContainer.appendChild(ctx)

  }

  clearDataChart(chartContainer:HTMLElement){

    const canvasElement = chartContainer?.querySelector('.myChart');

    if (canvasElement) {
      chartContainer?.removeChild(canvasElement);
    }

  }

}
