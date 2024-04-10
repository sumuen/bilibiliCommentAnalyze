const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

const targetFolder = path.join(__dirname,'output'); // 替换为包含 JSON 文件的文件夹路径
const outputFolder = path.join(__dirname,'csv_output'); // 输出 CSV 文件的目标文件夹

// 确保输出文件夹存在
if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
}

// 读取目标文件夹中的所有文件
fs.readdir(targetFolder, (err, files) => {
    if (err) {
        console.error('Error reading the directory:', err);
        return;
    }

    files.forEach(file => {
        if (path.extname(file) === '.json') {
            const jsonFilePath = path.join(targetFolder, file);
            const csvFilePath = path.join(outputFolder, file.replace('.json', '.csv'));

            // 读取 JSON 文件并转换为 CSV
            fs.readFile(jsonFilePath, 'utf8', (err, data) => {
                if (err) {
                    console.error(`Error reading the JSON file (${file}):`, err);
                    return;
                }
                try {
                    const jsonData = JSON.parse(data);
                    const fields = ['aid', 'data.floor', 'data.comment', 'data.author', 'data.like', 'data.title'];
                    const json2csvParser = new Parser({ fields });
                    const csv = json2csvParser.parse(jsonData);

                    // 将 CSV 数据写入文件
                    fs.writeFile(csvFilePath, csv, (err) => {
                        if (err) {
                            console.error(`Error writing the CSV file (${file}):`, err);
                        } else {
                            console.log(`CSV file saved: ${csvFilePath}`);
                        }
                    });
                } catch (e) {
                    console.error(`Error parsing JSON (${file}):`, e);
                }
            });
        }
    });
});
