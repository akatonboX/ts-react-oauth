import React from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';

export const OAUTH_DEFAULT_AUTHORIZED_PATH = "/oauth/authorized";
export interface OauthClientSettings{
  usePKCE: boolean;
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  revokeTokenUrl: string;
  createLogoutUrlFromAuthServer: (settings: OauthClientSettings) => string;
  scopes: string[];
}

export interface OauthClientSettingProps{
  usePKCE?: boolean;
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  callbackUrl?: string;
  revokeTokenUrl: string;
  createLogoutUrlFromAuthServer: (settings: OauthClientSettings) => string;
  scopes?: string[];
}

function getCurrentPath(){
  return window.location.href.substring(window.location.origin.length + process.env.PUBLIC_URL.length);
}
function propsToSettings(props: OauthClientSettingProps): OauthClientSettings{
  return{
    usePKCE: props.usePKCE != null ? props.usePKCE : true,
    authUrl: props.authUrl,
    tokenUrl: props.tokenUrl,
    clientId: props.clientId,
    clientSecret: props.clientSecret,
    callbackUrl: props.callbackUrl != null ? props.callbackUrl : window.location.origin + process.env.PUBLIC_URL + OAUTH_DEFAULT_AUTHORIZED_PATH,
    revokeTokenUrl: props.revokeTokenUrl,
    createLogoutUrlFromAuthServer: props.createLogoutUrlFromAuthServer,
    scopes:  props.scopes != null ? Array.from(new Set([...props.scopes, "openid"])) : ["openid"],
  }
}

export interface OauthContext{
  loggedIn?: {
    claim :any;
    defaultPath: string;
    logout: (pathAfterLogin?: string) => void;
  },
  noLoggedIn?: {
    /*ログイン処理を開始する。*/
    login: (pathAfterLogin: string) => void;
    /*コールバックページで実行する*/
    authorized: () => void;
  },
  clientSettings: OauthClientSettings;
}

interface Tokens{
  accessToken: string;
  refleshToken: string;
}
const Context = React.createContext<OauthContext | undefined>(undefined);

export const OauthProvider = function(
  props: {
    children: React.ReactNode,
  } & OauthClientSettingProps
) {

  //アクセストークン、リフレッシュトークンを保持
  const tokens = React.useRef<Tokens>({
    accessToken: "",
    refleshToken: ""
  });

  //ログイン状態を保持するstate
  const [loginState, setLoginState] = React.useState({
    isLogin: false,
    defaultPath: ""
  });
 
  //■クライアント設定の確定
  const clientSettings = propsToSettings(props);

  var oauthContext: OauthContext = {
    loggedIn: loginState.isLogin ? {
      claim: {},
      defaultPath: loginState.defaultPath,
      logout: async (pathAfterLogin) => {
        //■refleshTokenの破棄
        await (function () {
          return new Promise<void>(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.withCredentials = true;
            xhr.open("POST", clientSettings.revokeTokenUrl, true);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.setRequestHeader("Cache-Control", "no-store");
            xhr.setRequestHeader("Authorization", "Basic " + window.btoa(clientSettings.clientId + ":" + clientSettings.clientSecret));
            xhr.onreadystatechange = () => {
              if (xhr.readyState === XMLHttpRequest.DONE) {
                if(xhr.status !== 200){
                  console.error("revoke tokenに失敗。", xhr);
                }
                resolve();
              }
            }
            xhr.send(`client_id=${encodeURIComponent(clientSettings.clientId)}&client_secret=${encodeURIComponent(clientSettings.clientSecret)}&token=${encodeURIComponent(tokens.current.refleshToken)}`);
          });
        }());
console.log("★1")
        //■認証サーバからログアウト
        await (function () {
          return new Promise<void>(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.withCredentials = true;
            xhr.open("GET", clientSettings.createLogoutUrlFromAuthServer(clientSettings), true);
            xhr.setRequestHeader("Cache-Control", "no-store");
            xhr.onreadystatechange = () => {
              if (xhr.readyState === XMLHttpRequest.DONE) {
                if(xhr.status !== 200){
                  console.error("認証サーバからログアウトに失敗。", xhr);
                }
                resolve();
              }
            }
            xhr.send();
          });
        }());
        console.log("★3")
        //■tokenの破棄
        tokens.current = {
          accessToken: "",
          refleshToken: ""
        }
        //■login stateの書き換え
        setLoginState({
          isLogin: false,
          defaultPath: ""
        })
      },
    } : undefined,
    noLoggedIn: !loginState.isLogin ? {
      login: (pathAfterLogin) => {
        
        //■認証URLの構築
        var url = new URL(clientSettings.authUrl);
        url.searchParams.append("response_type", "code");
        url.searchParams.append("client_id", clientSettings.clientId);
        url.searchParams.append("hoge", "aaa");
        url.searchParams.append("redirect_uri", clientSettings.callbackUrl);
        var state = uuidv4();
        sessionStorage.setItem("oauth_state", state);
        url.searchParams.append("state", state + encodeURIComponent(pathAfterLogin)); 

        //■認可サーバーに遷移
        window.location.href = url.href;
      },
      authorized: () => {
        if(loginState.isLogin)return;//すでにログイン済みなら終了

        //■結果の取得
        var url = new URL(window.location.href);
        var code = url.searchParams.get("code");
        if(code == null)throw new Error("codeが存在しない");
        var state = url.searchParams.get("state");
        if(state == null)throw new Error("stateが存在しない");
        //■stateの確認
        var originState = sessionStorage.getItem("oauth_state");
        //sessionStorage.removeItem("oauth_state");
        if(state != null && originState != null && state.startsWith(originState)){//stateチェックOK

          //■リダイレクト先の構築
          var redirectPath = decodeURIComponent(state.substring(originState.length));

          //■アクセストークン取得
          var xhr = new XMLHttpRequest();
          xhr.withCredentials = true;
          xhr.open("POST", clientSettings.tokenUrl, true);
          xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
          xhr.setRequestHeader("Cache-Control", "no-store");
          xhr.setRequestHeader("Authorization", "Basic " + window.btoa(clientSettings.clientId + ":" + clientSettings.clientSecret));
          xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
              //■アクセストークンの格納
              var result = JSON.parse(xhr.response);
              var accessToken = result["access_token"] as string;
              var refleshToken = result["refresh_token"] as string;
              var tokenType = result["token_type"] as string;
              if(tokenType != "Bearer")throw new Error(`サポート外のtoken_typeです。token_type=${tokenType}`);
              
              tokens.current = {
                accessToken: accessToken,
                refleshToken: refleshToken
              }
              setLoginState({
                isLogin: true,
                defaultPath: redirectPath
              })
            }
          }
          xhr.send(`grant_type=authorization_code&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(clientSettings.callbackUrl)}&client_id=${encodeURIComponent(clientSettings.clientId)}`);
        }
        else{
          throw Error(`state checkの失敗。state=${state}, originState=${originState}`)
        }
      },
    } : undefined,
    clientSettings: clientSettings,
  };
  
  return (
    <Context.Provider value={oauthContext} >
       {props.children}
    </Context.Provider>
   
  );
};

export const useOauthContext = () => {
  return React.useContext(Context) as OauthContext;
}

//ログイン前のコールバックページに記述
export const useAuthorized = () => {
  const oauthContext = useOauthContext();
  React.useEffect(() => {
    if(oauthContext.noLoggedIn != null){
      oauthContext.noLoggedIn.authorized();
    }
  }, []);
}

//ログイン後のコールバックページに記述
export const useLoggedIn = () => {
  const oauthContext = useOauthContext();
  var navigate = useNavigate();
  React.useEffect(() => {
    if(oauthContext.loggedIn != null){
      navigate(oauthContext.loggedIn.defaultPath);
    }
  });
}

//ログイン前デフォルトページに記述
export const useUnauthorized = () => {
  const oauthContext = useOauthContext();
  React.useEffect(() => {
    if(oauthContext.noLoggedIn != null){
      oauthContext.noLoggedIn.login(getCurrentPath());
    }
  }, []);
}
