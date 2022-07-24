import axios from "axios";
import React from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { OAUTH_DEFAULT_AUTHORIZED_PATH, useOauthContext } from "./oauthProvider";

const NothingPage = function(
  props: {

  }
){
  return <></>;
}
const ToLoginPage = function(
  props: {

  }
){
  var oauthContext = useOauthContext();
  React.useEffect(() => {
    if(oauthContext.noLoggedIn != null){
      oauthContext.noLoggedIn.login();
    }
  })
  return <>bbb</>;
}

const AuthorizedPage = function(
  props: {

  }
){
  var oauthContext = useOauthContext();

  React.useEffect(() => {
    if(oauthContext.loggedIn != null)return;//すでに認証済みであれば終了

    if(oauthContext.clientSettings == null)throw new Error("oauthContext.clientSettingsが存在しない");
    //■結果の取得
    var url = new URL(window.location.href);
    var code = url.searchParams.get("code");
    if(code == null)throw new Error("codeが存在しない");
    var state = url.searchParams.get("state");
    if(state == null)throw new Error("stateが存在しない");
    //■stateの確認
    var originState = sessionStorage.getItem("oauth_state");
    sessionStorage.removeItem("oauth_state");
    if(state != null && originState != null && state.startsWith(originState)){//stateチェックOK
      //■リダイレクト先の構築
      var redirectPath = decodeURIComponent(state.substring(originState.length));
      //■アクセストークン取得
      var params = new URLSearchParams();

      var xhr = new XMLHttpRequest();
      xhr.open("POST", oauthContext.clientSettings.tokenUrl, true);
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      xhr.setRequestHeader("Cache-Control", "no-store");
      xhr.setRequestHeader("Authorization", "Basic " + window.btoa(oauthContext.clientSettings.clientId + ":" + oauthContext.clientSettings.clientSecret));
      
      xhr.onreadystatechange = () => {
        console.log(xhr.response);
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
          //■アクセストークンの格納
          var result = JSON.parse(xhr.response);
          var accessToken = result["access_token"] as string;
          var refleshToken = result["refresh_token"] as string;
          var tokenType = result["token_type"] as string;
          if(tokenType != "Bearer")throw new Error(`サポート外のtoken_typeです。token_type=${tokenType}`);
          oauthContext.noLoggedIn?.authorized(accessToken, refleshToken, redirectPath);
            
        }
      }

      xhr.send(`grant_type=authorization_code&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(oauthContext.clientSettings.callbackUrl)}&client_id=${encodeURIComponent(oauthContext.clientSettings.clientId)}`);
    

      // params.append("grant_type", "authorization_code");
      // params.append("code", code);
      // params.append("redirect_uri", oauthContext.clientSettings.callbackUrl);
      // params.append("client_id", oauthContext.clientSettings.clientId);
  
      // const result = axios.post(oauthContext.clientSettings.tokenUrl, params, {
      //   withCredentials: true,
      //   headers: { 
      //     "Cache-Control": "no-store", 
      //     "Content-Type": "application/x-www-form-urlencoded",
      //     "Authorization": "Basic " + window.btoa(oauthContext.clientSettings.clientId + ":" + oauthContext.clientSettings.clientSecret),
      //   },
      // }).then((response) => {
      //   console.log(response);
        
      // });


      

    }
    else{
      console.log({state: state, originState: originState})
    }
  }, [])
  return <>aaa</>;
}

//  //ログイン状態変更時に遷移を起こす。
//  React.useEffect(() => {
//   if(loginState.isLogin){
//     //navigate(loginState.targetPath);
//   }
// }, [loginState.isLogin]);

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
  console.log("OauthRoutes")
  return (
    <Routes>
      <>{publicRoutes != null ? publicRoutes.props["children"] : <></>}</>
      {
        oAuthContext.loggedIn != null ? //ログイン済み
          <>
            <Route path={props.authorizedPath != null ? props.authorizedPath : OAUTH_DEFAULT_AUTHORIZED_PATH} element={<NothingPage />} />
            {privateRoutes != null ? privateRoutes.props["children"] : <></>}
          </>
        : //ログイン前
          <>
            <Route path={props.authorizedPath != null ? props.authorizedPath : OAUTH_DEFAULT_AUTHORIZED_PATH} element={<AuthorizedPage />} />
            <Route path="*" element={<ToLoginPage />} />
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