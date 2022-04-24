const express = require('express')
const app = express()
const port = 3000
const axios = require('axios');
const config = require('config');

function timestampConverter(timestamp) {
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const date = new Date(Number(timestamp));
    const year = date.getFullYear();
    const month = date.getMonth() < 10 ? `0${date.getMonth()}` : date.getMonth();
    return {
        formattedDate: `${year}-${month}-01T00:00:00.000`,
        month: months[date.getMonth()],
        year
    };
}

function createResponse(data, ignore, month, year) {
    let output = {
        attendance: {
            month,
            year
        }
    };
    if (ignore) {
        output.ignored = {
            "museum": ignore,
            "visitors": data[ignore]
        }
        delete data[ignore];
    }
    delete data["month"];
    let high = 0;
    const values = Object.values(data);
    const min = Math.min(...values);
    let total = 0;
    for (const key in data) {
        if (Number(data[key]) > Number(high)) {
            high = data[key]
            output.attendance["highest"] = {
                "museum": key,
                "visitors": data[key]
            }
        }
        if (data[key] == min) {
            output.attendance["lowest"] = {
                "museum": key,
                "visitors": data[key]
            }
        }
        total += Number(data[key]);
    }
    return {
        ...output,
        total
    };
}

app.get('/api/visitors', (req, res) => {
    try {
        let {
            date,
            ignore
        } = req.query;
        if (!date) {
            res.status(404);
            return res.json({
                message: `Required field date is missing`
            })
        }
        let {
            formattedDate,
            month,
            year
        } = timestampConverter(date);
        axios.get(config.get('host'))
            .then(function (response) {
                let {
                    data
                } = response;
                const result = data.filter(obj => obj.month == formattedDate);
                if (result) res.json(createResponse(result[0], ignore, month, year));
                else {
                    res.status(204);
                    res.send();
                }
            })
            .catch(function (error) {
                console.log(error);
                res.status(500);
                res.send({
                    message: "Internal Server Error"
                })
            })
    } catch (error) {
        console.log(error);
        res.status(500);
        res.send({
            message: "Internal Server Error"
        })
    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})