const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const readline = require('readline');
const util = require('util');
const readFile = util.promisify(fs.readFile);
let fileCount = 0;
let meaCount = 0;
let replyCount= 0;
let totalRows = 0;

let allUserIdMatches = [];
let allCommentContentMatches = [];
let userIdMatchCount = 0;
let commentContentMatchCount = 0;

function matchUserId(row) {
    const validUserIds = ['234978716', '1141159409', '439438614', '1168527940', '3546376048741135', '1358327273', '8455326', '3494380876859618'];
    return validUserIds.includes(row['用户ID']);
}

function matchCommentContent(row) {
    const searchTexts = ['@有趣的程序员', '@AI视频小助理', '@课代表猫', '@机器工具人', '@木几萌Moe', '@星崽丨StarZai', '@AI课代表呀', '@AI沈阳美食家'];
    return row['评论内容'] && searchTexts.some(text => row['评论内容'].startsWith(text));
}


async function processCsv(filePath) {
    const lineCount = await countLines(filePath);
    if (lineCount < 200) {
        return; // 评论数小于 200 的文件作废，前期爬虫没有筛选好
    }
    const fileName = path.basename(filePath, path.extname(filePath));
    let isMea = false;
    //check if multiple reply in one video 
    let isReply = false;
    const stream = fs.createReadStream(filePath)
        .pipe(csv());
    let hasRowGreaterThan200 = false;
    for await (const row of stream) {
        totalRows++;
        hasRowGreaterThan200 = true;
        let foundUserIdMatch = false;
        let foundCommentContentMatch = false;
        if (matchUserId(row)) {
            if (!isReply) {
                replyCount++
                isReply = true;
            }
            foundUserIdMatch = true;
            userIdMatchCount++;
       
        }

        if (matchCommentContent(row)) {
            if (!isMea) {
                meaCount++
                isMea = true;
            }
            foundCommentContentMatch = true;
            commentContentMatchCount++;
        
        }

        if (foundUserIdMatch || foundCommentContentMatch) {
            let extractedData = extractData(row, fileName);
            const videoInfo = await findVideo(fileName);
            //console.log(videoInfo);
            if (videoInfo) {
                extractedData.data.title = videoInfo.title;
                //extractedData.data.play = videoInfo.play;
                //extractedData.data.duration = formatDuration(videoInfo.duration);
                //console.log(extractedData);
            }

            if (foundUserIdMatch) {
                allUserIdMatches.push(extractedData);
            }
            if (foundCommentContentMatch) {
                allCommentContentMatches.push(extractedData);
            }
        }
    }
    if (hasRowGreaterThan200) {
        fileCount++;
    }
    //console.log(`Completed processing ${filePath}`);
}




const directoryPath = path.join(__dirname, 'csvdata'); // csvdata
fs.readdir(directoryPath, (err, files) => {
    if (err) {
        console.error('Error reading the directory', err);
        return;
    }

    let promises = files.filter(file => path.extname(file) === '.csv')
        .map(file => processCsv(path.join(directoryPath, file)));

    Promise.all(promises).then(() => {
        const timestamp = Date.now();
        const targetFolder = path.join(__dirname, `output_${timestamp}`); //output

        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder, { recursive: true });
        }
            fs.writeFile(path.join(targetFolder, 'userIdMatches.json'), JSON.stringify(allUserIdMatches, null, 2), err => {
            if (err) {
                console.error('Error writing userIdMatches.json:', err);
            } else {
                console.log('UserId matches saved to userIdMatches.json');
            }
        });

        fs.writeFile(path.join(targetFolder,'commentContentMatches.json'), JSON.stringify(allCommentContentMatches, null, 2), err => {
            if (err) {
                console.error('Error writing commentContentMatches.json:', err);
            } else {
                console.log('Comment content matches saved to commentContentMatches.json');
            }
        });
        console.log(`Found ${fileCount} videos with more than 200 rows.`);
        console.log(`Found ${totalRows} comments.`);
        console.log(`Found ${replyCount} videos is reply.`);
        console.log(`Found ${meaCount} videos is mentioned to generate summary.`);
        console.log(`Found ${userIdMatchCount} ai reply in videos`);
        console.log(`Found ${commentContentMatchCount} comment startsWith @ai.`);
    });


});


async function countLines(filePath) {
    const stream = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity
    });

    let lineCount = 0;
    for await (const line of stream) {
        lineCount++;
    }

    return lineCount;
}

function extractData(row, fileName) {
    return {
        aid: fileName,
        data: {
            floor: row['编号'],
            comment: row['评论内容'],
            author: row['昵称'],
            like: row['点赞数']
        }
    };
}
async function findVideo(fileName) {
    const arcurl = 'http://www.bilibili.com/video/' + fileName;
    //console.log(arcurl);
    try {
        const data = await readFile('video.json', 'utf8');
        const jsonData = JSON.parse(data);
        const results = jsonData; 
        return results.find(item => item.arcurl === arcurl) || null;
    } catch (e) {
        //console.error("Error in findVideo:", e);
        return null;
    }
}
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
}
