const mysql = require('mysql2/promise')
const txtgen = require('txtgen')

async function main () {
    try {
        let appdata = await genNavyCollections()
        console.log(JSON.stringify(appdata))
    }
    catch (e) {
        console.error(e)
    }
}

main()
  
async function generateReviews (assetId, benchmarkId) {
    try {
        const reviews = []
        let rules = await getRules(benchmarkId)
        let results = generateResultSet( rules.length )
        for (let x=0, l=rules.length; x < l; x++) {
            let action = null, actionComment = null
            if (results[x] === 'fail') {
                action = getRandomInt(2) % 2 ? 'remediate' : 'mitigate'
                actionComment = txtgen.paragraph(2)
            }
            reviews.push(
                {
                    assetId: assetId,
                    ruleId: rules[x].ruleId,
                    result: results[x],
                    resultComment: txtgen.paragraph(2),
                    autoResult: false,
                    action: action,
                    actionComment: actionComment,
                    status: getRandomInt(2) % 2 ? 'saved' : 'submitted', //Alternate between "saved" and "submitted",
                    userId: 1,
                    ts: "2020-06-03T20:36:31.000Z",
                    rejectText: null,
                    rejectUserId: null,
                    metadata: {},
                    history: []
                }
            )
        }
        return reviews  
    }
    catch (e) {
        console.error(e.message)
    }
}

async function getRules( benchmarkId ) {
    let connection
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 50001,
            user: 'stigman',
            password: 'stigman',
            database: 'stigman'
          })
          let sql = `select
            rgr.ruleId
          from
            current_rev rev
            left join rev_group_map rg using (revId)
             left join rev_group_rule_map rgr using (rgId)
          where
            rev.benchmarkId = ?     `
          const [rows, fields] = await connection.execute(sql, [benchmarkId])
          return rows
    }
    catch (e) {
        console.error(e.message)
    }
    finally {
        connection.end()
    }
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function generateResultSet( size ) {
    const results = []
    for (let x=0; x < size; x++) {
        let r = getRandomInt(100)
        if (r == 0) { // 1%
            results.push('fail')
        }
        else if ( r >= 1 && r <= 95) { // 95%
            results.push('pass')
        }
        else {
            results.push('notapplicable')
        }
    }
    return results
}

function genUsers() {
    return [
        {
            "userId": "1",
            "username": "admin",
            "statistics": {
                "lastAccess": 0,
                "lastClaims": {}
            }
        },
        {
            "userId": "2",
            "username": "user02",
            "statistics": {
                "lastAccess": 0,
                "lastClaims": {}
            }
        },
        {
            "userId": "3",
            "username": "user03",
            "statistics": {
                "lastAccess": 0,
                "lastClaims": {}
            }
        },
        {
            "userId": "4",
            "username": "user04",
            "statistics": {
                "lastAccess": 0,
                "lastClaims": {}
            }
        },
        {
            "userId": "5",
            "username": "user05",
            "statistics": {
                "lastAccess": 0,
                "lastClaims": {}
            }
        },
    ]
}

function genStigGrants(os) {
    const stigs = {
        Windows: [
            'Windows_10_STIG',
            'Microsoft_Access_2016',
            'Microsoft_Excel_2016',
            'Microsoft_Office_System_2016',
            'Microsoft_Outlook_2016',
            'Microsoft_Project_2016',
            'Microsoft_Word_2016',
            'MS_Dot_Net_Framework',
            'Google_Chrome_Current_Windows',
            'Mozilla_Firefox_STIG'
        ],
        Servers: [
            'Windows_Server_2016_STIG',
            'MS_Dot_Net_Framework',
            'Google_Chrome_Current_Windows',
            'Mozilla_Firefox_STIG',
            'IIS_10-0_Server_STIG',
            'IIS_10-0_Site_STIG',
            'Oracle_Database_12c_STIG',
            'MS_SQL_Server_2016_Database_STIG',
            'MS_SQL_Server_2016_Instance_STIG'   
        ],
        Linux: [
            'U_CAN_Ubuntu_18-04_STIG',
            'RHEL_7_STIG',
            'Mozilla_Firefox_STIG',
            'PostgreSQL_9-x_STIG'
        ]
    }
    let stigGrants = []
    for (let x=0, l=stigs[os].length; x<l; x++) {
        stigGrants.push({
            benchmarkId: stigs[os][x],
            userIds: x % 2 ? ['5'] : [] //Alternate between assigments to 5
        })
    }
    return stigGrants
}

async function genNavyCollections() {
    try {
        const networks = ['RDTE', 'DMZ', 'NCCM', 'CE', 'Lab' ]
        // const locations = [
        //     'Newport',
        //     'Crane',
        //     'Dahlgren ',
        //     'Caderock',
        //     'Panama City',
        //     'Philadelphia',
        //     'Port Hueneme',
        //     'Keyport'
        // ]
        const locations = [
            'Newport'
        ]
        const oses = ['Windows', 'Linux', 'Servers']

        const appdata = {
            users:[],
            collections: [],
            assets: [],
            reviews: []
        }

        appdata.users = genUsers()

        appdata.collections = []
        let x = 1
        let assetId = 1
        let collectionId = 1
        for (const location of locations) {
            for (const network of networks) {
                for (const os of oses) {
                    appdata.collections.push({
                        collectionId: collectionId.toString(),
                        name: `${location} ${network}-${os}`,
                        workflow: 'emass',
                        metadata: {},
                        grants: [
                            {
                                userId: x % 2 ? '1' : '2', //Alternate between users 1 and 2
                                accessLevel: 4
                            }
                        ]
                    })
                    for( let y=1; y<=25; y++) {
                        // console.error(`asset ${assetId}`)
                        let stigGrants = genStigGrants(os)
                        appdata.assets.push({
                            assetId: assetId.toString(),
                            collectionId: collectionId.toString(),
                            name: `Asset_${os}_${String(assetId.toString()).padStart(4, '0')}`,
                            description: null,
                            ip: null,
                            noncomputing: true,
                            metadata: {},
                            stigGrants: stigGrants
                        })
                        for (let x=0, l=stigGrants.length; x<l; x++) {
                            // console.error(`reviews ${stigGrants[x].benchmarkId}`)
                            let reviews = await generateReviews(assetId.toString(), stigGrants[x].benchmarkId)
                            appdata.reviews = appdata.reviews.concat(reviews)
                        }
                        assetId++
                    }    
                    collectionId++
                    x++         
                }
            }
        }
        return (appdata)
    }
    catch (e) {
        console.error(e)
    }
}
