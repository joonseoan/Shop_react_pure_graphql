import React, { Component, Fragment } from 'react';
import { Route, Switch, Redirect, withRouter } from 'react-router-dom';

import Layout from './components/Layout/Layout';
import Backdrop from './components/Backdrop/Backdrop';
import Toolbar from './components/Toolbar/Toolbar';
import MainNavigation from './components/Navigation/MainNavigation/MainNavigation';
import MobileNavigation from './components/Navigation/MobileNavigation/MobileNavigation';
import ErrorHandler from './components/ErrorHandler/ErrorHandler';
import FeedPage from './pages/Feed/Feed';
import SinglePostPage from './pages/Feed/SinglePost/SinglePost';
import LoginPage from './pages/Auth/Login';
import SignupPage from './pages/Auth/Signup';
import './App.css';


// might need to implement this on the project

class App extends Component {
  state = {
    showBackdrop: false,
    showMobileNav: false,
    isAuth: false,
    token: null,
    userId: null,
    authLoading: false,
    error: null
  };

  componentDidMount() {
    const token = localStorage.getItem('token');
    const expiryDate = localStorage.getItem('expiryDate');
    
    if (!token || !expiryDate) {
      return;
    }

    // A way to compare Date to Date
    if (new Date(expiryDate) <= new Date()) {
      this.logoutHandler();
      return;
    }
    
    const userId = localStorage.getItem('userId');
    const remainingMilliseconds =
      // A way to compare time to time
    new Date(expiryDate).getTime() - new Date().getTime();
    
    this.setState({ isAuth: true, token: token, userId: userId });
    this.setAutoLogout(remainingMilliseconds);
  }

  mobileNavHandler = isOpen => {
    this.setState({ showMobileNav: isOpen, showBackdrop: isOpen });
  };

  backdropClickHandler = () => {
    this.setState({ showBackdrop: false, showMobileNav: false, error: null });
  };

  logoutHandler = () => {
    this.setState({ isAuth: false, token: null });
    localStorage.removeItem('token');
    localStorage.removeItem('expiryDate');
    localStorage.removeItem('userId');
  };

  loginHandler = (event, authData) => {
    event.preventDefault();
    this.setState({ authLoading: true });

    // 1) [ REST ]
    // fetch('http://localhost:8080/auth/login', {
    //  method: 'POST',
    
    // 2) [ GraphQL ]
    // this is a rootQuery.
    //  So no need to set "mutation"
    const graphQLQuery = {
      query: `
        query Login($email: String!, $password: String!) {
          login(
            email: $email, password: $password
          ) {
            userId
            token
          }
        }
      `,
      variables: { email: authData.email, password: authData.password }
    };

    fetch('http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'bearer ' + token value!!!!
      },

      // [REST]
      // body: JSON.stringify({
      //   email: authData.email,
      //   password: authData.password
      // })

      body: JSON.stringify(graphQLQuery)
    })
    .then(res => {
      // [ REST ]
      // if (res.status === 422) {
      //   throw new Error('Validation failed.');
      // }
      // if (res.status !== 200 && res.status !== 201) {
      //   console.log('Error!');
      //   throw new Error('Could not authenticate you!');
      // }
      return res.json();
    })
    .then(resData => {
      console.log(resData);
      if(resData.errors && resData.errors[0].status === 401) {
        throw new Error(resData.errors[0].data[0].message ||  resData.errors[0].message);   
      }

      if(resData.errors) {
        throw new Error('Unable to login.');
      }
      // [ GraphQL ]
      // When [REST], we filter out "data.login" out of resData.data.login.*
      this.setState({
        isAuth: true,
        token: resData.data.login.token,
        authLoading: false,
        userId: resData.data.login.userId
      });
      localStorage.setItem('userId', resData.data.login.userId);
      localStorage.setItem('token', resData.data.login.token);
      const remainingMilliseconds = 60 * 60 * 1000;
      const expiryDate = new Date(
        new Date().getTime() + remainingMilliseconds
      );

      // must be string.....
      localStorage.setItem('expiryDate', expiryDate.toISOString());
      this.setAutoLogout(remainingMilliseconds);
    })
    .catch(err => {
      console.log(err);
      this.setState({
        isAuth: false,
        authLoading: false,
        error: err
      });
    });
  };

  signupHandler = (event, authData) => {
    event.preventDefault();
    const { email, password, name } = authData.signupForm;
    this.setState({ authLoading: true });

    
    // to send data over json.
    const graphQLQuery = {
      // we need a built-in key, "query"
      query: `
      mutation CreateUser($email: String!, $password: String!, $name: String!) {
        createUser(userInput: {
          email: $email,
          password: $password,
          name: $name}
          ) {
            _id
            email
            name
          }
        }`,
        variables: { email: email.value, password: password.value, name: name.value }
      }
      
      // 2) GraphQL
      // "graphql" is only a end point in graphql env.
      // still using json to send values of inputs ********8
      // Ultimately, it is a role "8080/graphql" 
      fetch('http://localhost:8080/graphql', {
        // createUser : POST
        // Keep in mind that "graphql" supports only POST and GET************************
        
        //*******************************************************88
        
        // CORS ERROR Control!!! 
        // It is only in Express-GraphQL environment!!!!!!!!! of the server side.
        // Please remember that the browser sends a method "OPTIONS"
        //  before it sends "POST", "GET", "PUT", "PATCH", "DELETE" to the server.
        
        // The prblem is that "GraphQL" supports only "POST" and "GET"!!!!!!!
        //  not supports "OPTIONS" and any other methods!!!!!!!!!1
        // Therefore, "OPTIONS" is denied!!!!
        
        // The solution is that we must put
        //  res.sendStatus(200) if the mehtod === "OPTIONS"
        
        // ***********************************************************888
        method: 'POST',
        
        // 1) REST
        // This is put. Therefore, we need to set a method.
        // fetch('http://localhost:8080/auth/signup', {
          //   method: 'PUT',
          
          headers: {
          'Content-Type': 'application/json'
        // 'Authorization': 'bearer ' + token value!!!!
      },
      body: JSON.stringify(
        // [REST]
        // { email: email.value,
        // password: password.value,
        // name: name.value }
        
        // [GraphQL]
        graphQLQuery
      )
    })
    .then(res => {

      // [REST]
      // if (res.status === 422) {
      //   throw new Error(
      //     "Validation failed. Make sure the email address isn't used yet!"
      //   );
      // }

      // if (res.status !== 200 && res.status !== 201) {
        //   console.log('Error!');
        //   throw new Error('Creating a user failed!');
        // }
        
        // [ GraphQL ]
        // We do not need to check error here**************************
        //  because error and error message are contained in "res.json({})" 
        //  not in the separate  "res.status" object.!!!!!!!
        return res.json();
      })
      .then(resData => {

        //[ GraphQL ]
        // createUser: {_id: "5ca7e5141d89bd079cdf5235", email: "aaa@aaa.com", name: "JA"}
        console.log(resData);
        
        // [ GraphQL ]
        if(resData.errors && resData.errors[0].status === 422) {
          throw new Error(resData.errors[0].data[0].message ||  resData.errors[0].message);   
        }
        
        this.setState({ isAuth: false, authLoading: false });
        this.props.history.replace('/');
      })
      .catch(err => {
        console.log(err);
        this.setState({
          isAuth: false,
          authLoading: false,
          error: err
        });
      });
    };

  setAutoLogout = milliseconds => {
    setTimeout(() => {
      this.logoutHandler();
    }, milliseconds);
  };

  errorHandler = () => {
    this.setState({ error: null });
  };

  render() {

   //  console.log(props)

    let routes = (
      <Switch>
        <Route
          path="/"
          exact

          // instead of Component
          render={

            // props: built-in helper functions in Route class
            // It runs and is invoked in Route class.
            props => (
            <LoginPage
              { ...props } 
              onLogin={this.loginHandler} // additional props to be an attribute in Route class
              loading={this.state.authLoading} // additional props to be an attribute in Route class
            />
          )}
        />
        
        <Route
          path="/signup"
          exact
          render={props => (
            <SignupPage
              {...props}
              onSignup={this.signupHandler}
              loading={this.state.authLoading}
            />
          )}
        />
        <Redirect to="/" />
      </Switch>
    );
    if (this.state.isAuth) {
      routes = (
        <Switch>
          <Route
            path="/"
            exact
            render={props => (
              <FeedPage userId={this.state.userId} token={this.state.token} />
            )}
          />
          <Route
            path="/:postId"
            render={props => (
              <SinglePostPage
                {...props}
                userId={this.state.userId}
                token={this.state.token}
              />
            )}
          />
          <Redirect to="/" />
        </Switch>
      );
    }
    return (
      <Fragment>

        {this.state.showBackdrop && (
          <Backdrop onClick={this.backdropClickHandler} />
        )}

        <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />

        <Layout
          header={
            <Toolbar>
              <MainNavigation
                onOpenMobileNav={this.mobileNavHandler.bind(this, true)}
                onLogout={this.logoutHandler}
                isAuth={this.state.isAuth}
              />
            </Toolbar>
          }
          mobileNav={
            <MobileNavigation
              open={this.state.showMobileNav}
              mobile
              onChooseItem={this.mobileNavHandler.bind(this, false)}
              onLogout={this.logoutHandler}
              isAuth={this.state.isAuth}
            />
          }
        />
        {routes}
      </Fragment>
    );
  }
}

export default withRouter(App);
