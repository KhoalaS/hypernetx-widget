import React from "react";
import { render } from "react-dom";

import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Checkbox from "@material-ui/core/Checkbox";
import TextField from "@material-ui/core/TextField";
import Select from "@material-ui/core/Select";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import { makeStyles } from "@material-ui/core/styles";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import CircularProgress from "@material-ui/core/CircularProgress";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import { Typography } from "@material-ui/core";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from "@material-ui/core";

import { HypernetxWidget } from "../../src/";

const useStyles = makeStyles((theme) => ({
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    },
    title: {
        fontSize: 14,
    },
    datacell: {
        padding: "4px",
    },
    list: {
        maxHeight: "100px",
        overflow: "scroll",
    },
}));

const hslToHex = (h, s, l) => {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color)
            .toString(16)
            .padStart(2, "0"); // convert to Hex and prefix "0" if needed
    };
    return `#${f(0)}${f(8)}${f(4)}`;
};

let history = [];
let backIndex = 1;
const g = `{
    "0": [0, 1, 2],
    "1": [2,3,4],
    "2": [3, 5]
}`;

let color = "RED";
var newGraph = null;
const defaultFill = {};
let frontier = [];
let showAccordion = false;
const defaultExecs = [
    {
        name: "Tiny",
        k: 0,
    },
    {
        name: "VD",
        k: 0,
    },
    {
        name: "ED",
        k: 0,
    },
    {
        name: "Small",
        k: 0,
    },
    {
        name: "Tri",
        k: 0,
    },
    {
        name: "ETri",
        k: 0,
    },
    {
        name: "AVD",
        k: 0,
    },
    {
        name: "ADVD",
        k: 0,
    },
    {
        name: "SED2",
        k: 0,
    },
    {
        name: "SED2*",
        k: 0,
    },
    {
        name: "F3",
        k: 0,
    },
];

const defaultApproxData = [{ ratio: NaN, c: 0, opt: 0 }];

function Demo() {
    const [incidenceDict, setIncidenceDict] = React.useState(JSON.parse(g));
    const [checked, setChecked] = React.useState("");
    const [nodeFill, setNodeFill] = React.useState(defaultFill);

    const [files, setFiles] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [rule_data, setRuleData] = React.useState(defaultExecs);
    const [last_rule_data, setLastRuleData] = React.useState([]);
    const [appr_data, setApprData] = React.useState(defaultApproxData);

    const colorRef = React.useRef("");
    const frSwitch = React.useRef(null);
    const frOnlySwitch = React.useRef(null)
    const classes = useStyles();

    const n = React.useRef(null);
    const p = React.useRef(null);
    const evr = React.useRef(null);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch("http://localhost:8097/graphs");
                if (!response.ok) {
                    throw new Error("Failed to fetch data");
                }
                const jsonData = await response.json();
                setFiles(jsonData);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const nodesSet = new Map();
    const edges = Object.entries(incidenceDict).map(([uid, elements]) => {
        elements.forEach((uid) => {
            nodesSet.set(uid, { uid });
        });

        return { uid, elements };
    });

    const nodes = Array.from(nodesSet.values());
    let nodeFillLocal = {};
    Object.assign(nodeFillLocal, nodeFill);

    const handleUpdate = () => {
        if (newGraph != null && Object.keys(newGraph).length > 0) {
            setIncidenceDict(newGraph);
        }
    };

    const handleClick = () => {
        let url = "http://localhost:8097/nextrule"
        if (frOnlySwitch.current.checked){
            url = "http://localhost:8097/nextrule?fronly=1"
        }
        fetch(url).then((res) => {
            if (res.status == 204) {
            } else if (res.status == 200) {
                res.json().then((data) => {
                    //const rem = [];
                    newGraph = data.graph;
                    history.push(data.graph);
                    console.log(data);
                    //nodesSet.forEach((_, k) => {
                    //    if (data.vertices.indexOf(k) == -1) {
                    //        rem.push(k);
                    //    }
                    //});
                    frontier = data.frontier;
                    console.log(nodes);
                    const newFill = nodes
                        .map((e) => e.uid)
                        .reduce((obj, key, index) => {
                            if (frSwitch.current.checked) {
                                if (frontier.indexOf(key) != -1) {
                                    obj[key] = hslToHex(180, 100, 50);
                                }
                            }
                            if (data.c.indexOf(key) != -1) {
                                obj[key] = hslToHex(0, 100, 50);
                            } else if (data.vertices.indexOf(key) == -1) {
                                obj[key] = hslToHex(240, 100, 50);
                            }
                            return obj;
                        }, {});

                    setNodeFill(newFill);
                    let ratio;
                    if (data.ratio == -1) {
                        ratio = NaN;
                    } else {
                        ratio = Math.round(data.ratio * 10000) / 10000;
                    }
                    setApprData([
                        { ratio: ratio, c: data.c.length, opt: data.opt },
                    ]);

                    const last_data = [];

                    data.execs_data.forEach((val, idx) => {
                        const diff = val.k - rule_data[idx].k;
                        if (diff > 0) {
                            last_data.push({ name: val.name, k: diff });
                        }
                    });
                    setLastRuleData(last_data);
                    setRuleData(data.execs_data);
                });
            }
        });
    };

    const handleBack = () => {
        if (history.length - backIndex == 0) {
            return;
        }
        setIncidenceDict(history[history.length - backIndex - 1]);
        backIndex++;
    };

    const handleToggle = (value) => () => {
        setChecked(value);
        fetch(`http://localhost:8097/setgraph?g=${value}`, {
            method: "POST",
        }).then((res) => {
            if (res.status == 200) {
                setNodeFill(defaultFill);
                setApprData(defaultApproxData);
                setRuleData(defaultExecs);
                setLastRuleData([]);
                history = [];
                frontier = [];
                backIndex = 1;
                res.json().then((data) => {
                    console.log(data);
                    setIncidenceDict(data["graph"]);
                });
            }
        });
    };

    const generateGraph = () => {
        const payload = {
            model: "ER",
            n: Number(n.current.value),
            p: Number(p.current.value),
            evr: Number(evr.current.value),
        };
        console.log(payload);
        fetch("http://localhost:8097/random", {
            method: "POST",
            body: JSON.stringify(payload),
        }).then((res) => {
            if (res.status == 200) {
                setNodeFill(defaultFill);
                setApprData(defaultApproxData);
                setRuleData(defaultExecs);
                setLastRuleData([]);
                history = [];
                frontier = [];
                backIndex = 1;
                res.json().then((data) => {
                    setIncidenceDict(data.graph);
                    history.push(data.graph);
                });
            }
        });
    };

    const handleChangeColor = () => {
        let col = hslToHex(0, 100, 50);
        if (color == "BLACK") {
            col = hslToHex(0, 35, 15.6);
        } else if (color == "BLUE") {
            col = hslToHex(240, 100, 50);
        }

        const ids = String(colorRef.current.value).split(",");
        const newFill = ids.reduce((obj, key, index) => {
            obj[key] = col;
            return obj;
        }, {});

        setNodeFill({ ...Object.assign(newFill, nodeFill) });
    };

    return (
        <Grid container>
            <Grid item xs={2}>
                <Card>
                    <CardContent>
                        <Typography
                            className={classes.title}
                            color="textSecondary"
                            gutterBottom
                        >
                            rule executions
                        </Typography>
                        <Table aria-label="simple table">
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        className={classes.datacell}
                                        style={{ fontWeight: "bold" }}
                                    >
                                        rule
                                    </TableCell>
                                    <TableCell
                                        className={classes.datacell}
                                        style={{ fontWeight: "bold" }}
                                        align="right"
                                    >
                                        applications
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rule_data.map((row) => (
                                    <TableRow key={row.name}>
                                        <TableCell
                                            className={classes.datacell}
                                            component="th"
                                            scope="row"
                                        >
                                            {row.name}
                                        </TableCell>
                                        <TableCell
                                            className={classes.datacell}
                                            align="right"
                                        >
                                            {row.k}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card style={{ marginTop: "16px" }}>
                    <CardContent>
                        <Typography
                            className={classes.title}
                            color="textSecondary"
                            gutterBottom
                        >
                            last rule
                        </Typography>
                        <Table aria-label="simple table">
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        className={classes.datacell}
                                        style={{ fontWeight: "bold" }}
                                    >
                                        rule
                                    </TableCell>
                                    <TableCell
                                        className={classes.datacell}
                                        style={{ fontWeight: "bold" }}
                                        align="right"
                                    >
                                        applications
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {last_rule_data.map((row) => (
                                    <TableRow key={row.name}>
                                        <TableCell
                                            className={classes.datacell}
                                            component="th"
                                            scope="row"
                                        >
                                            {row.name}
                                        </TableCell>
                                        <TableCell
                                            className={classes.datacell}
                                            align="right"
                                        >
                                            {row.k}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card style={{ marginTop: "16px" }}>
                    <CardContent>
                        <Table aria-label="simple table">
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        className={classes.datacell}
                                        style={{ fontWeight: "bold" }}
                                    >
                                        est. ratio
                                    </TableCell>
                                    <TableCell
                                        className={classes.datacell}
                                        style={{ fontWeight: "bold" }}
                                        align="right"
                                    >
                                        |C|
                                    </TableCell>
                                    <TableCell
                                        className={classes.datacell}
                                        style={{ fontWeight: "bold" }}
                                        align="right"
                                    >
                                        est. opt
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {appr_data.map((row) => (
                                    <TableRow key={row.name}>
                                        <TableCell
                                            className={classes.datacell}
                                            component="th"
                                            scope="row"
                                        >
                                            {row.ratio}
                                        </TableCell>
                                        <TableCell
                                            className={classes.datacell}
                                            align="right"
                                        >
                                            {row.c}
                                        </TableCell>
                                        <TableCell
                                            className={classes.datacell}
                                            align="right"
                                        >
                                            {row.opt}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={8}>
                <HypernetxWidget
                    {...{ nodes, edges, ...{ nodeFill: nodeFillLocal } }}
                />
            </Grid>
            <Grid item xs={2}>
                <Button
                    style={{ width: "100%" }}
                    onClick={() => {
                        if (!showAccordion) {
                            document
                                .querySelector("#accordion")
                                .style.removeProperty("display");
                        } else {
                            document
                                .querySelector("#accordion")
                                .style.setProperty("display", "none");
                        }
                        showAccordion = !showAccordion;
                    }}
                >
                    show left sidepanel
                </Button>
                <Card style={{ marginTop: "16px" }}>
                    <CardContent>
                        <Typography
                            className={classes.title}
                            color="textSecondary"
                            gutterBottom
                        >
                            3-uniform er graph gen
                        </Typography>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                            }}
                        >
                            <TextField
                                id="standard-basic"
                                label="n"
                                variant="standard"
                                inputRef={n}
                                defaultValue={10}
                                autoComplete="off"
                            />
                            <TextField
                                id="standard-basic"
                                label="p"
                                variant="standard"
                                inputRef={p}
                                defaultValue={0}
                                autoComplete="off"
                            />
                            <TextField
                                id="standard-basic"
                                label="evr"
                                variant="standard"
                                inputRef={evr}
                                defaultValue={0.5}
                                autoComplete="off"
                            />
                        </div>
                        <Button
                            style={{ marginTop: "4px", width: "100%" }}
                            onClick={generateGraph}
                        >
                            Generate
                        </Button>
                    </CardContent>
                </Card>
                <Card style={{ marginTop: "16px" }}>
                    <CardContent>
                        <Typography
                            className={classes.title}
                            color="textSecondary"
                            gutterBottom
                        >
                            vertex color control
                        </Typography>
                        <FormGroup>
                            <FormControlLabel
                                control={<Switch inputRef={frSwitch} />}
                                label="color frontier vertices"
                            />
                        </FormGroup>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <TextField
                                id="standard-basic"
                                label="vertices"
                                variant="standard"
                                inputRef={colorRef}
                                defaultValue={colorRef.current}
                                autoComplete="off"
                            ></TextField>
                            <FormControl className={classes.formControl}>
                                <InputLabel htmlFor="demo-simple-select-label">
                                    color
                                </InputLabel>
                                <Select
                                    native
                                    inputProps={{
                                        name: "color",
                                        id: "demo-simple-select-label",
                                    }}
                                    onChange={(e) => (color = e.target.value)}
                                    defaultValue={"RED"}
                                >
                                    <option value={"RED"}>red</option>
                                    <option value={"BLUE"}>blue</option>
                                    <option value={"BLACK"}>black</option>
                                </Select>
                            </FormControl>
                        </div>
                        <div style={{ display: "flex" }}>
                            <Button
                                style={{ width: "60%" }}
                                onClick={handleChangeColor}
                            >
                                change color
                            </Button>
                            <Button
                                style={{ width: "40%" }}
                                onClick={() => {
                                    setNodeFill(defaultFill);
                                }}
                            >
                                reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card style={{ marginTop: "16px" }}>
                    <CardContent>
                        <Typography
                            className={classes.title}
                            color="textSecondary"
                            gutterBottom
                        >
                            algorithm control
                        </Typography>
                        <ButtonGroup
                            variant="text"
                            aria-label="text primary button group"
                            style={{ width: "100%" }}
                        >
                            <Button onClick={handleBack}>Back</Button>
                            <Button onClick={handleClick}>Next</Button>
                            <Button onClick={handleUpdate}>Update</Button>
                        </ButtonGroup>
                        <FormGroup>
                            <FormControlLabel
                                control={<Switch inputRef={frOnlySwitch} />}
                                label="only show frontier"
                            />
                        </FormGroup>
                    </CardContent>
                </Card>

                {loading && <CircularProgress />}
                {error && <p>Error: {error}</p>}
                {files && (
                    <Card style={{ marginTop: "16px" }}>
                        <CardContent>
                            <Typography
                                className={classes.title}
                                color="textSecondary"
                                gutterBottom
                            >
                                graph files
                            </Typography>
                            <List
                                style={{
                                    bgcolor: "background.paper",
                                    overflowY: "scroll",
                                    maxHeight: 150,
                                }}
                            >
                                {files.map((value) => {
                                    const labelId = `checkbox-list-label-${value}`;

                                    return (
                                        <ListItem key={value}>
                                            <Button
                                                onClick={handleToggle(value)}
                                            >
                                                <ListItemIcon>
                                                    <Checkbox
                                                        edge="start"
                                                        checked={
                                                            checked == value
                                                        }
                                                        tabIndex={-1}
                                                        disableRipple
                                                        inputProps={{
                                                            "aria-labelledby": labelId,
                                                        }}
                                                    />
                                                </ListItemIcon>
                                                <ListItemText
                                                    id={labelId}
                                                    primary={value}
                                                />
                                            </Button>
                                        </ListItem>
                                    );
                                })}
                            </List>
                        </CardContent>
                    </Card>
                )}
            </Grid>
        </Grid>
    );
}

render(<Demo />, document.querySelector("#demo"));
