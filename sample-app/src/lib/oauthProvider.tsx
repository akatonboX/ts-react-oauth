import React from "react";
import { v4 as uuidv4 } from 'uuid';

export const OAUTH_DEFAULT_AUTHORIZED_PATH = "/oauth/authorized";
export interface OauthContext{
  loggedIn?: {
    claim :any;
    logout: () => void;
  },
  noLoggedIn?: {
    login: (path?: string) => void;
    authorized: (accessToken: string, refleshToken: string, targetPath: string) => void;
  },
  clientSettings?: OauthClientSettings;
}

interface ContextData{
  accessToken: string;
  refleshToken: string;
}
export interface OauthClientSettingProps{
  usePKCE?: boolean;
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  callbackUrl?: string;
  scopes?: string[];
  defaurltPath?: string;
}

export interface OauthClientSettings{
  usePKCE: boolean;
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  scopes: string[];
  defaurltPath: string;
}

interface Tokens{
  accessToken: string;
  refleshToken: string;
}
const Context = React.createContext<OauthContext | undefined>(undefined);

export const OauthProvider = function(
  props: {
    children: React.ReactNode;
  } & OauthClientSettingProps
) {

  

  //アクセストークン、リフレッシュトークンを保持
  const tokens = React.useRef<Tokens | undefined>(undefined);
  //ログイン状態を保持するstate
  const [loginState, setLoginState] = React.useState({
    isLogin: false,
    targetPath: ""
  });
 
 

  var clientSettings = {
    usePKCE: props.usePKCE != null ? props.usePKCE : false,
    authUrl: props.authUrl,
    tokenUrl: props.tokenUrl,
    clientId: props.clientId,
    clientSecret: props.clientSecret,
    callbackUrl: props.callbackUrl != null ? props.callbackUrl : process.env.PUBLIC_URL + OAUTH_DEFAULT_AUTHORIZED_PATH,
    scopes: props.scopes != null ? Array.from(new Set([...props.scopes, "openid"])) : ["openid"],
    defaurltPath: props.defaurltPath != null ? props.defaurltPath : "",
  }




  var oauthContext: OauthContext = {
    loggedIn: loginState.isLogin ? {
      claim: {},
      logout: () => {},
    } : undefined,
    noLoggedIn: !loginState.isLogin ? {
      login: (path?: string) => {
        console.log("★login")
        //■認証URLの構築
        var url = new URL(props.authUrl);
        url.searchParams.append("response_type", "code");
        url.searchParams.append("client_id", clientSettings.clientId);
        url.searchParams.append("hoge", "aaa");
        url.searchParams.append("redirect_uri", clientSettings.callbackUrl);
        var state = uuidv4();
        sessionStorage.setItem("oauth_state", state);
        url.searchParams.append("state", state + encodeURIComponent(path != null ? path : window.location.href.substring(process.env.PUBLIC_URL.length)));     
        //■認可サーバーに遷移
        window.location.href = url.href;
      },
      authorized: (accesstoken, refleshToken, targetPath) => {
        tokens.current = {
          accessToken: accesstoken,
          refleshToken: refleshToken
        }
        setLoginState({
          isLogin: true,
          targetPath: targetPath
        })
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

export const useOauthControler = () => {
  return React.useContext(Context) as OauthContext;
}