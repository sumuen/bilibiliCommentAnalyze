const fs = require('fs');
const path = require('path');
const folderPath = path.join(__dirname, 'data');
let outputPath = path.join(__dirname, 'video');
function urlJson() {
    let extractedData = []; // 在此定义 extractedData 数组

    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error("Error reading directory:", err);
            return;
        }

        files.forEach(file => {
            if (path.extname(file) === '.json') {
                const filePath = path.join(folderPath, file);
                fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err) {
                        console.error("Error reading file:", err);
                        return;
                    }

                    try {
                        const jsonData = JSON.parse(data);
                        const results = jsonData.data.result;

                        results.forEach(item => {
                            const { arcurl, title, play, duration } = item;
                            extractedData.push({ arcurl, title, play, duration });
                        });

                        fs.writeFile(outputPath, JSON.stringify(extractedData, null, 2), err => {
                            if (err) {
                                console.error("Error writing file:", err);
                            } else {
                                console.log("Data successfully written to", outputPath);
                            }
                        });

                    } catch (e) {
                        console.error("Error parsing JSON:", e);
                    }
                });
            }
        });
    });
}

function urlTxt(folderPath, outputPath) {
    let urlList = '';

    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error("Error reading directory:", err);
            return;
        }

        const jsonFiles = files.filter(file => path.extname(file) === '.json').map(file => path.join(folderPath, file));
        Promise.all(jsonFiles.map(file => readJsonFile(file)))
            .then(results => {
                results.forEach(result => {
                    result.forEach(item => {
                        urlList += item.arcurl + '\n';
                    });
                });

                fs.writeFile(outputPath, urlList, err => {
                    if (err) {
                        console.error("Error writing file:", err);
                    } else {
                        console.log("URLs successfully written to", outputPath);
                    }
                });
            })
            .catch(error => {
                console.error("Error processing files:", error);
            });
    });
}
function readJsonFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            try {
                const jsonData = JSON.parse(data);
                resolve(jsonData.data.result);
            } catch (e) {
                reject(e);
            }
        });
    });
}
function main() {
    const format = process.argv[2]; // 获取命令行参数

    switch (format) {
        case 'txt':
            outputPath += '.txt';
            urlTxt(folderPath, outputPath);
            break;
        case 'json':
            outputPath += '.json';
            urlJson();
            break;
        default:
            console.log("Please specify the format as 'txt' or 'json'.");
            break;
    }
}

main();