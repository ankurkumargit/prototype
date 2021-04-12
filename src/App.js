import './App.css';
import { useEffect, useState } from 'react';
import { utils, read } from 'xlsx';
function App() {
  const [data, setData] = useState({});
  const [isExcelValid, setIsExcelValid] = useState(false);
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);

  const fileHandler = (event) => {
    let f = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = read(bstr, { type: 'binary' });

      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const excelData = utils.sheet_to_csv(ws, { header: 1 });
      if (excelData) {
        const excelJSON = convertToJson(excelData);
        var dataObj = {
          items: excelJSON,
          columns: getColumnsAndTypes(excelJSON),
        };
        if (validateColumn(dataObj.columns) && validateExcel(dataObj)) {
          setData(dataObj);
          setIsExcelValid(true);
        } else {
          alert('File is not valid');
        }
      } else {
        alert('File is not valid');
      }
    };
    reader.onerror = (err) => {
      console.log(err);
    };
    reader.readAsBinaryString(f);
    event.target.value = '';
  };

  const convertToJson = (csv) => {
    var lines = csv.split('\n');
    lines.splice(lines.length - 1, 1);
    var result = [];
    var headers = lines[0].split(',');

    for (let i = 1; i < lines.length; i++) {
      var obj = {};
      var currentline = lines[i].split(',');
      if (
        currentline.length > 0 ||
        (currentline.length === 1 && currentline[0])
      ) {
        for (var j = 0; j < headers.length; j++) {
          if (headers[j]) obj[headers[j]] = currentline[j];
        }
      }
      result.push(obj);
    }
    return result;
  };

  const getColumnsAndTypes = (excelData) => {
    var columns = Object.keys(excelData[0]);
    var colsAndTypes = [];
    for (let i = 0; i < columns.length; i++) {
      var obj = {};
      obj.name = columns[i];
      obj.type = getType(excelData[0][columns[i]]);
      colsAndTypes.push(obj);
    }
    return colsAndTypes;
  };

  const getType = (column) => {
    var type = 'invalid';
    if (
      column.replace('yes', '').length === 0 ||
      column.replace('no', '').length === 0
    ) {
      type = 'bool';
    } else if (
      column.split('').filter(function (x) {
        return x === '/';
      }).length === 2 ||
      column.split('').filter(function (x) {
        return x === '-';
      }).length === 2
    ) {
      type = 'date';
    } else if (isValidNumber(column)) {
      type = 'number';
    } else if (isValidString(column)) {
      type = 'string';
    }
    return type;
  };

  const validateExcel = (excelData) => {
    var isExcelValid = true;
    for (let i = 0; i < excelData.columns.length; i++) {
      if (!isExcelValid) {
        break;
      }

      // Getting column wise data
      var data = excelData.items.map(function (x) {
        return x[excelData.columns[i].name];
      });

      if (excelData.columns[i].type === 'invalid') {
        isExcelValid = false;
        break;
      } else if (excelData.columns[i].type === 'date') {
        var dates = [],
          formattedDates = [];

        for (let index = 0; index < data.length; index++) {
          if (!isValidNumber(data[index].replaceAll('/', ''))) {
            isExcelValid = false;
            break;
          }
          var date = new Date(data[index]);
          if (isNaN(date.getTime())) {
            isExcelValid = false;
            break;
          } else {
            var formedDate =
              (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) +
              '-' +
              (date.getMonth() + 1 < 10
                ? '0' + (date.getMonth() + 1)
                : date.getMonth() + 1) +
              '-' +
              date.getFullYear();
            excelData.items[index][
              excelData.columns[i].name + 'DateFormat'
            ] = formedDate;
            dates.push(formedDate);
            formattedDates.push(date);
          }
        }
        excelData[excelData.columns[i].name + 'MaximumDate'] = new Date(
          Math.max.apply(null, formattedDates)
        );
        excelData[excelData.columns[i].name + 'MinimumDate'] = new Date(
          Math.min.apply(null, formattedDates)
        );
        // excelData[
        //   excelData.columns[i].name.replaceAll(' ', '_')
        // ] = formattedDates;
      } else if (excelData.columns[i].type === 'bool') {
        for (let index = 0; index < data.length; index++) {
          if (data[index] !== 'yes' && data[index] !== 'no') {
            isExcelValid = false;
            break;
          }
        }
        // excelData[excelData.columns[i].name] = data;
      } else if (excelData.columns[i].type === 'number') {
        for (let index = 0; index < data.length; index++) {
          if (!isValidNumber(data[index]) || !data[index]) {
            isExcelValid = false;
            break;
          }
        }
        // excelData[excelData.columns[i].name] = data;
      } else if (excelData.columns[i].type === 'string') {
        for (let index = 0; index < data.length; index++) {
          if (!isValidString(data[index]) || !data[index]) {
            isExcelValid = false;
            break;
          }
        }
        // excelData[excelData.columns[i].name] = data;
      }
    }
    // if (isExcelValid) {
    //   localModel.setData(excelData);
    //   localModel.refresh(true);
    // }
    return isExcelValid;
  };

  const validateColumn = (cols) => {
    var columnValid = true;
    for (var i = 0; i < cols.length; i++) {
      if (!isValidString(cols[i].name)) {
        columnValid = false;
        break;
      }
    }
    return columnValid;
  };

  const isValidString = (str) => {
    var alphanumeric = /^[a-z0-9 ]+$/i;
    return alphanumeric.test(str);
  };

  const isValidNumber = (num) => {
    var numbers = /^[0-9]+$/;
    return numbers.test(num.replace('.', ''));
  };

  useEffect(() => {
    console.log(data);
  }, [data]);

  return (
    <div>
      {!isExcelValid ? (
        <input type='file' onChange={fileHandler} style={{ padding: '10px' }} />
      ) : (
        <button onClick={() => setIsExcelValid(false)}>Go Back</button>
      )}
    </div>
  );
}

export default App;
