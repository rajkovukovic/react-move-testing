// @flow weak
/* eslint react/no-multi-comp: 'off' */

import { scaleOrdinal } from 'd3-scale';
import { arc, pie } from 'd3-shape';
import { shuffle } from 'd3-array';
import * as easing from 'd3-ease';
import sortBy from 'lodash/sortBy';
import Surface from './Surface';
import React, { PureComponent } from 'react';
import NodeGroup from 'react-move/NodeGroup';
import cities from './cities';


const DURATION = 1200;  // time (ms)
const MAX_CITIES = 200;

const colors = scaleOrdinal()
  .range(['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a']);

// **************************************************
//  SVG Layout
// **************************************************
const view = [1000, 550]; // [width, height]
const trbl = [10, 10, 10, 10]; // [top, right, bottom, left] margins

const dims = [ // Adjusted dimensions [width, height]
  view[0] - trbl[1] - trbl[3],
  view[1] - trbl[0] - trbl[2],
];

const mockData = [...(new Set(cities.map(city => city.name)))].slice(0, Math.round(MAX_CITIES * 1.1));

const radius = (dims[1] / 2) * 0.70;

const pieLayout = pie()
  .value((d) => d.value)
  .sort(null);

const innerArcPath = arc()
  .innerRadius(radius * 0.5)
  .outerRadius(radius * 1.0);

const outerArcPath = arc()
  .innerRadius(radius * 1.2)
  .outerRadius(radius * 1.2);

function mid(d) {
  return Math.PI > (d.startAngle + (d.endAngle - d.startAngle));
}

function getRandom(min, max) {
  return Math.floor(Math.random() * (max - (min + 1))) + min;
}

function getArcs() {
  const data = shuffle(mockData).slice(0, getRandom(MAX_CITIES * 0.9, MAX_CITIES * 1))
    .map((name) => ({ name, value: getRandom(10, 200) }));

  return pieLayout(sortBy(data, (d) => d.name));
}

class Example extends PureComponent {
  state = {
    arcs: getArcs(),
  }

  componentWillMount() {
    this.firstRun = true;
    window.addEventListener('click', this.update);
    window.addEventListener('touchstart', this.update);
    window.addEventListener('keydown', this.keyPress);
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.update);
    window.removeEventListener('touchstart', this.update);
    window.removeEventListener('keydown', this.keyPress);
  }

  keyPress = (e) => {
    const keycode = (e.keyCode ? e.keyCode : e.which);
    if (keycode === 13) {
      this.update(e);
    }
  }

  update = (e) => {
    e.preventDefault();
    e.stopPropagation();

    this.setState(() => ({
      arcs: getArcs(),
    }));
  }

  render() {
    const { arcs } = this.state;
    const firstRun = this.firstRun;
    this.firstRun = false;

    return (
      <div style={{ maxWidth: '180vh' }}>
        <label
          style={{ position: 'absolute' }}
        >
          touch, click or press Enter key to update
        </label>
        <Surface view={view} trbl={trbl}>
          <g transform={`translate(${dims[0] / 2}, ${dims[1] / 2})`}>
            <NodeGroup
              data={arcs}
              keyAccessor={(d) => d.data.name}

              start={({ startAngle, endAngle }) => ({
                startAngle: (startAngle + endAngle) / 2,
                endAngle: (startAngle + endAngle) / 2,
                opacity: 0,
                scale: 0,
                entering: 1,
                leaving: 0,
              })}

              enter={({ startAngle, endAngle }) => ({
                startAngle: [startAngle],
                endAngle: [endAngle],
                opacity: [1],
                scale: [1],
                entering: [0],
                timing: { delay: firstRun ? 0 : 2 * 0, duration: DURATION, ease: easing.easeCircleInOut },
              })}

              update={({ startAngle, endAngle }) => ({
                startAngle: [startAngle],
                endAngle: [endAngle],
                timing: { delay: firstRun ? 0 : DURATION * .1, duration: DURATION * .5, ease: easing.easeCircleInOut },
              })}

              leave={({ startAngle, endAngle }) => ({
                scale: [0],
                opacity: [0],
                leaving: [1],
                timing: { delay: 0, duration: DURATION / 2, ease: easing.easeCircleInOut },
              })}
            >
              {(nodes) => {
                return (
                  <g>
                    {nodes.map(({ key, data, state }) => {
                      const p1 = outerArcPath.centroid(state);
                      const p2 = [
                        mid(state) ? p1[0] + (radius * 0.5) : p1[0] - (radius * 0.5),
                        p1[1],
                      ];
                      const midAngle = (state.startAngle + state.endAngle) / 2 - Math.PI / 2;
                      return (
                        <g key={key}
                          // transform={`scale(${state.scale})`}
                          transform={state.leaving
                            ? `translate(${Math.cos(midAngle) * state.leaving * radius}, ${Math.sin(midAngle) * state.leaving * radius})`
                            : state.entering
                              ? `scale(${state.scale})`
                              : 'none'
                          }
                          opacity={state.opacity}
                        >
                          <text
                            dy="2px"
                            fontSize="6px"
                            transform={`translate(${p2.toString()})`}
                            textAnchor={mid(state) ? 'start' : 'end'}
                          >
                            {data.data.name}
                          </text>
                          <polyline
                            fill="none"
                            stroke="rgba(127,127,127,0.5)"
                            points={`${innerArcPath.centroid(state)},${p1},${p2.toString()}`}
                          />
                          <path
                            d={innerArcPath(state)}
                            fill={colors(data.data.name)}
                            opacity={0.9}
                          />
                        </g>
                      );
                    })}
                  </g>
                );
              }}
            </NodeGroup>
          </g>
        </Surface>
      </div>
    );
  }
}

export default Example;