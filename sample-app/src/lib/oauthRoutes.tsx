import axios from "axios";
import React from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { OAUTH_DEFAULT_AUTHORIZED_PATH, useAuthorized, useLoggedIn, useOauthContext, useUnauthorized } from "./oauthProvider";


const AuthorizedPage = function(
  props: {

  }
){
  console.log("★AuthorizedPage")
  useAuthorized();
  return <>AuthorizedPage</>;
}

const LoggedInPage = function(
  props: {

  }
){
  console.log("★LoggedInPage")
  useLoggedIn();
  return <>LoggedInPage</>;
}


const UnauthorizedPage = function(
  props: {

  }
){
  console.log("★UnauthorizedPage")
  useUnauthorized();
  return <>ToLoginPage</>;
}



export const OauthRoutes = function(
  props: {
    path?: string,
    authorizedPath?: string,
    children: React.ReactElement[];
  }
) {
  const oAuthContext = useOauthContext();


  const publicRoutes = props.children.find(item => item.type === OauthRoutes.Public);
  const privateRoutes = props.children.find(item => item.type === OauthRoutes.private);
  return (
    <Routes>
      <>{publicRoutes != null ? publicRoutes.props["children"] : <></>}</>
      {
        oAuthContext.loggedIn != null ? //ログイン済み
          <>
            <Route path={props.authorizedPath != null ? props.authorizedPath : OAUTH_DEFAULT_AUTHORIZED_PATH} element={<LoggedInPage />} />
            {privateRoutes != null ? privateRoutes.props["children"] : <></>}
          </>
        : //ログイン前
          <>
            <Route path={props.authorizedPath != null ? props.authorizedPath : OAUTH_DEFAULT_AUTHORIZED_PATH} element={<AuthorizedPage />} />
            <Route path="*" element={<UnauthorizedPage />} />
          </>
      }
    </Routes>
  )

}

OauthRoutes.Public = function(
  props: {
    children: React.ReactElement | React.ReactElement[];
  }
) {
  return <>{props.children}</>;
}

OauthRoutes.private = function(
  props: {
    children: React.ReactElement | React.ReactElement[];
  }
) {
  return <>{props.children}</>;
}