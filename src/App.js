import React, { Component } from 'react';
import './App.css';
import Map from './Map';
import Helmet from "react-helmet";
import ReactFileReader from 'react-file-reader';
import axios from 'axios';
import _ from 'lodash';

class App extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      markers: [],
      origin: null,
      destination: null,
      originDisplay: null,
      destinationDisplay: null,
      directions: null
    };
    this.handleMapLoad = this.handleMapLoad.bind(this);
    this.handleMapClick = this.handleMapClick.bind(this);
    this.handleMarkerRightClick = this.handleMarkerRightClick.bind(this);
    this.handleFiles = this.handleFiles.bind(this);
    this.setDirectionsLine = this.setDirectionsLine.bind(this);
    this.showTwoPoints = this.showTwoPoints.bind(this);
    this.reset = this.reset.bind(this);
    this.optimalRoute = this.optimalRoute.bind(this);
  }
  
  showTwoPoints() {
    if(this.state.origin && this.state.destination && this._mapComponent) {
      const DirectionsService = new google.maps.DirectionsService(); // eslint-disable-line no-undef
      DirectionsService.route({
        origin: this.state.origin,
        destination: this.state.destination,
        travelMode: google.maps.TravelMode.DRIVING, // eslint-disable-line no-undef
      }, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) { // eslint-disable-line no-undef
          this.setState({
            directions: result,
            origin: null,
            destination: null,
            originDisplay: null,
            destinationDisplay: null
          });
        } else {
          console.error(`error fetching directions ${result}`);
        }
      });
    }
  }
  
  handleMapLoad(map) {
    this._mapComponent = map;
    if (map) {
      console.log(map);
    }
  }
  
  /*
   * This is called when you click on the map.
   * Go and try click now.
   */
  handleMapClick(event) {
    const nextMarkers = [
      ...this.state.markers,
      {
        position: event.latLng,
        defaultAnimation: 2,
        key: Date.now(), // Add a key property for: http://fb.me/react-warning-keys
      },
    ];
    this.setState({
      markers: nextMarkers,
    });
  }
  
  handleMarkerRightClick(targetMarker) {
    /*
     * All you modify is data, and the view is driven by data.
     * This is so called data-driven-development. (And yes, it's now in
     * web front end and even with google maps API.)
     */
    const nextMarkers = this.state.markers.filter(marker => marker !== targetMarker);
    this.setState({
      markers: nextMarkers,
    });
  }
  
  handleFiles (files) {
    let reader = new FileReader();
    let me = this;
    reader.onload = function(e) {
      let addresses = reader.result.split('\n').filter(a=>a.length).map(a=>a.replace(/#/g, ''));
      let promises = addresses
        .map(a=>
          axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${a}&key=AIzaSyCksj83B6icTE61syFO5_ISxx7PvP96vX4`));
      Promise.all(promises).then(results=>{
        results = _.flattenDeep(results.map(r=>r.data.results));
        results = results.filter(a=>a.formatted_address.indexOf('Colombia')>-1);
        results = results.map((a, idx)=>{
          return {
            position: {
              lat: a.geometry.location.lat,
              lng: a.geometry.location.lng,
            },
            key: `Point-${idx}`,
            defaultAnimation: 2,
          };
        });
        let markers = Object.assign([], me.state.markers.map(a=>{
          let newAddress = Object.assign({}, a);
          return newAddress;
        }));
        markers = _.union(markers, results);
        me.setState({
          markers
        });
      });
    }
    if(files[0]){
      reader.readAsText(files[0]);
    }
  }
  
  setDirectionsLine(position) {
    if(!this.state.origin) {
      let originDisplay= position;
      let origin = new google.maps.LatLng(position.lat, position.lng); // eslint-disable-line no-undef
      this.setState({
        originDisplay,
        origin
      });
    } else if(!this.state.destination) {
      let destinationDisplay= position;
      let destination = new google.maps.LatLng(position.lat, position.lng); // eslint-disable-line no-undef
      this.setState({
        destinationDisplay,
        destination
      }, ()=>{
        this.showTwoPoints();
      });
    }
  }
  
  reset(){
    location.reload();// eslint-disable-line no-restricted-globals
  }
  
  optimalRoute() {
    if(!this.state.origin) {
      alert('please select origin');
      return;
    }
    if(this.state.markers.length===0){
      alert('please choose an adresses file');
      return;
    }
    
    if(this.state.origin && this.state.markers.length) {
      let waypoints = this.state.markers.map(m=>m.position);
      console.log('wayPoints', waypoints);
      waypoints = _.without(waypoints, this.state.originDisplay);
      console.log('waypoints1', waypoints);
      let destination = waypoints[waypoints.length-1];
      waypoints = _.without(waypoints, this.state.originDisplay, destination);
      console.log('waypoints2', waypoints);
      const DirectionsService = new google.maps.DirectionsService(); // eslint-disable-line no-undef
      destination = new google.maps.LatLng(destination.lat, destination.lng); // eslint-disable-line no-undef
      waypoints = waypoints.map((m)=>{
        console.log('m', m);
        return {
          location: new google.maps.LatLng(m.lat, m.lng), // eslint-disable-line no-undef
          stopover: true
        };
      });
      
      DirectionsService.route({
        origin: this.state.origin,
        destination,
        waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING, // eslint-disable-line no-undef
      }, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) { // eslint-disable-line no-undef
          this.setState({
            directions: result,
            origin: null,
            destination: null,
            originDisplay: null,
            destinationDisplay: null
          });
        } else {
          console.error(`error fetching directions ${result}`);
        }
      });
    }
  }
  
  render() {
    return (
      <div className="App" >
        <Helmet
          title="Getting Started"
        />
        <Map
          containerElement={
            <div style={{ height: '100%' }} />
          }
          mapElement={
            <div style={{ height: '100%' }} />
          }
          onMapLoad={this.handleMapLoad}
          onMapClick={this.handleMapClick}
          markers={this.state.markers}
          onMarkerRightClick={this.handleMarkerRightClick}
          setDirectionsLine={this.setDirectionsLine}
          directions={this.state.directions}
        />
        <ReactFileReader handleFiles={this.handleFiles} fileTypes={'.dat'}>
            <button className='btn'>choose Addresses File</button>
        </ReactFileReader>
        <button className='btn' onClick={this.reset}>reset</button>
        <div>
          {!!(this.state.originDisplay) && <p>origin: ({this.state.originDisplay.lat}, {this.state.originDisplay.lng})
            <button className='btn' onClick={this.optimalRoute}>Select best route from this point</button>
          </p>}
          {!!(this.state.destinationDisplay) && <p>destination: ({this.state.destinationDisplay.lat}, {this.state.destinationDisplay.lng})</p>}
          {!!(this.state.originDisplay) && !!(this.state.destinationDisplay) &&
          <p><button
            onClick={this.showTwoPoints}
            className='btn'
          >Show Directions between selected points
          </button></p>}
        </div>
      </div>
    );
  }
}

export default App;
