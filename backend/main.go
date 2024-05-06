package main

import (
	"flag"
	"net"
	"net/http"
	"os"
	"encoding/json"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/sirupsen/logrus"
)

var logger = logrus.New()

func main() {
	var socketPath string
	flag.StringVar(&socketPath, "socket", "/run/guest-services/backend.sock", "Unix domain socket to listen on")
	flag.Parse()

	_ = os.RemoveAll(socketPath)
	
	logger.SetOutput(os.Stdout)

	logMiddleware := middleware.LoggerWithConfig(middleware.LoggerConfig{
		Skipper: middleware.DefaultSkipper,
		Format: `{"time":"${time_rfc3339_nano}","id":"${id}",` +
			`"method":"${method}","uri":"${uri}",` +
			`"status":${status},"error":"${error}"` +
			`}` + "\n",
		CustomTimeFormat: "2006-01-02 15:04:05.00000",
		Output:           logger.Writer(),
	})

	logger.Infof("Starting listening on %s\n", socketPath)
	router := echo.New()
	router.HideBanner = true
	router.Use(logMiddleware)
	startURL := ""

	ln, err := listen(socketPath)
	if err != nil {
		logger.Fatal(err)
	}
	router.Listener = ln

	router.GET("/packages", packages)

	logger.Fatal(router.Start(startURL))
}

func listen(path string) (net.Listener, error) {
	return net.Listen("unix", path)
}

type CloudsmithQuery struct {
    APIKey 		  string `json:"api_key"`
    Organization  string `json:"organization"`
	Repository    string `json:"repo"`
	GroupImages	  bool   `json:"group"`
}

func packages(ctx echo.Context) error {
	query := ctx.QueryParam("creds");
	var creds CloudsmithQuery;
	json.Unmarshal([]byte(query), &creds);

	url := "https://api.cloudsmith.io/v1/packages/" + creds.Organization + "/" + creds.Repository + "/?page=1&page_size=1000&query=format%3Adocker&sort=-date";
	client := http.Client{}
	req, _ := http.NewRequest("GET", url, nil)
	req.Header = http.Header{
		"X-Api-Key": {creds.APIKey},
	}
	res, _ := client.Do(req)

	var j []map[string]interface{}
	json.NewDecoder(res.Body).Decode(&j)

	if creds.GroupImages {
		var result []map[string]interface{}
	
		appendPullTag := func(item map[string]interface{}, tagInfo map[string]interface{}) {
			pullTags, ok := item["pullTags"].([]map[string]interface{})
			if !ok {
				pullTags = []map[string]interface{}{}
			}
			pullTags = append(pullTags, tagInfo)
			item["pullTags"] = pullTags
		}
	
		for _, value := range j {
			existingItem := func() *map[string]interface{} {
				for _, item := range result {
					if item["name"] == value["name"] {
						return &item
					}
				}
				return nil
			}()
	
			tag := "sha256:" + value["version"].(string)
			if versions, ok := value["tags"].(map[string]interface{})["version"].([]string); ok && len(versions) > 0 {
				tag = versions[0]
			}
	
			tagInfo := map[string]interface{}{
				"tag":           tag,
				"architectures": value["architectures"],
				"tags":          value["tags"],
				"type":          value["type_display"],
			}
	
			if existingItem != nil {
				appendPullTag(*existingItem, tagInfo)
			} else {
				value["pullTags"] = []map[string]interface{}{tagInfo}
				result = append(result, value)
			}
		}
	
		return ctx.JSON(http.StatusOK, result)
	}

	logger.Printf("%s", j)
	return ctx.JSON(http.StatusOK, j)
}

type HTTPMessageBody struct {
	Message string
}
