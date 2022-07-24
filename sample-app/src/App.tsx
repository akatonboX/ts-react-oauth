import React from 'react';
import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MainPage } from './page/mainPage';
import { TopPage } from './page/topPage';
import { OauthProvider } from './lib/oauthProvider';
import { OauthRoutes } from './lib/oauthRoutes';
import { SubPage } from './page/subPage';

function App() {
  React.useEffect(() => {
    var ngPath = "http://localhost:3000/";
    if(window.location.href.startsWith(ngPath)){
      window.location.href = "http://127.0.0.1:3000/" + window.location.href.substring(ngPath.length);
    }
  }, []);
  return (
    <OauthProvider 
      authUrl="http://localhost:9000/oauth2/authorize" 
      tokenUrl="http://localhost:9000/oauth2/token" 
      clientId="example" 
      clientSecret="secret" 
      callbackUrl="http://127.0.0.1:3000/oauth/authorized"
      revokeTokenUrl="http://localhost:9000/oauth2/revoke"
      createLogoutUrlFromAuthServer={(settings => "http://localhost:9000/logout")}
      >
      <BrowserRouter>
        <OauthRoutes>
          <OauthRoutes.Public>
            <Route path="/" element={<TopPage/>} />
            
          </OauthRoutes.Public>
          <OauthRoutes.private>
            <Route path="/main" element={<MainPage />} />
            <Route path="/sub" element={<SubPage />} />
          </OauthRoutes.private>
        </OauthRoutes>
      </BrowserRouter>
    </OauthProvider>
  );
}

export default App;
